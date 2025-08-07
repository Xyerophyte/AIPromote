import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { UserRole, DbUser } from "@/types/auth"
import { supabaseAdmin } from "@/lib/supabase"
import type { User, NextAuthConfig, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

export const config = {
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
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Query user from Supabase
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          if (error || !user) {
            console.error('User not found:', error)
            return null
          }

          // Verify password (if stored in database)
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password_hash || ''
          )

          if (!isValidPassword) {
            console.error('Invalid password')
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as UserRole,
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
    signOut: "/auth/signin",
    verifyRequest: "/auth/verify-email",
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }: {
      token: JWT
      user?: User
      account?: any
      profile?: any
      trigger?: "signIn" | "signUp" | "update"
    }): Promise<JWT> {
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
                token.role = updatedUser.role as UserRole
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
                  role: UserRole.USER,
                  email_verified: new Date().toISOString(),
                })
                .select()
                .single()

              if (newUser) {
                token.id = newUser.id
                token.role = newUser.role as UserRole
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
    async session({ session, token }: {
      session: Session
      token: JWT
    }): Promise<Session> {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
    async signIn({ user, account, profile }: {
      user: User
      account: any
      profile?: any
    }): Promise<boolean> {
      // Allow all sign ins for now
      // Add custom logic here if needed (e.g., email verification checks)
      return true
    },
    async redirect({ url, baseUrl }: {
      url: string
      baseUrl: string
    }): Promise<string> {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
