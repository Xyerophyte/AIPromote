"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function Unauthorized() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold text-red-600">403</h1>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isAuthenticated 
              ? `Sorry, your role (${user?.role}) doesn't have permission to access this page.`
              : "You need to be signed in to access this page."
            }
          </p>
        </div>
        
        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
              <div>
                <Button variant="outline" asChild>
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <div>
                <Button variant="outline" asChild>
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
