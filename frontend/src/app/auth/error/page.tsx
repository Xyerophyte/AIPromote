"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or is invalid.",
  Default: "An error occurred during authentication.",
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")
  
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
          <Link 
            href="/auth/signin"
            className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Try Again
          </Link>
          <div>
            <Link 
              href="/"
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-slate-900 bg-white border-2 border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
