"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or is invalid.",
  Default: "An error occurred during authentication.",
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  
  const errorMessage = errorMessages[error || ""] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold text-red-600">⚠️</h1>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage}
          </p>
          {error && (
            <p className="mt-1 text-xs text-gray-500">
              Error code: {error}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Button asChild>
            <Link href="/auth/signin">
              Try Again
            </Link>
          </Button>
          <div>
            <Button variant="outline" asChild>
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
