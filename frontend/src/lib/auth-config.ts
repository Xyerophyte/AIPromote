import { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { UserRole, DbUser } from "@/types/auth"
import { supabaseAdmin } from "@/lib/supabase"

const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Authenticate with Supabase
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          if (error || !user) {
            return null
          }

          // Verify password (if stored in database)
          // Note: In production, you might want to use Supabase Auth instead
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password_hash || ''
          )

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: user.email_verified ? new Date(user.email_verified) : null,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id
        token.role = user.role
        token.emailVerified = user.emailVerified

        // For OAuth providers, create/update user in Supabase
        if (account.provider !== "credentials") {
          try {
            // Check if user exists
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', user.email!)
              .single()

            if (existingUser) {
              // Update existing user
              const { data: updatedUser } = await supabaseAdmin
                .from('users')
                .update({
                  name: user.name,
                  image: user.image,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingUser.id)
                .select()
                .single()

              if (updatedUser) {
                token.id = updatedUser.id
                token.role = updatedUser.role
                token.emailVerified = updatedUser.email_verified ? new Date(updatedUser.email_verified) : null
              }
            } else {
              // Create new user
              const { data: newUser } = await supabaseAdmin
                .from('users')
                .insert({
                  email: user.email!,
                  name: user.name,
                  image: user.image,
                  role: 'user' as UserRole,
                  email_verified: new Date().toISOString(),
                })
                .select()
                .single()

              if (newUser) {
                token.id = newUser.id
                token.role = newUser.role
                token.emailVerified = new Date(newUser.email_verified!)
              }
            }

            // Store OAuth account information
            await supabaseAdmin
              .from('accounts')
              .upsert({
                user_id: token.id as string,
                type: account.type,
                provider: account.provider,
                provider_account_id: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              })
          } catch (error) {
            console.error("OAuth user creation/update error:", error)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

export default authConfig
