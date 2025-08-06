"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import Link from "next/link"

export default function Dashboard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to your Dashboard!
              </h2>
              <p className="text-gray-600 mb-8">
                This is a protected page that requires authentication.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">User Profile</h3>
                  <p className="text-gray-600 mb-4">Manage your account settings</p>
                  <Button asChild size="sm">
                    <Link href="/profile">
                      View Profile
                    </Link>
                  </Button>
                </div>
                
                {user?.role === "ADMIN" && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Admin Panel</h3>
                    <p className="text-gray-600 mb-4">Manage users and system settings</p>
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/admin">
                        Admin Panel
                      </Link>
                    </Button>
                  </div>
                )}
                
                {(user?.role === "MODERATOR" || user?.role === "ADMIN") && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Moderation</h3>
                    <p className="text-gray-600 mb-4">Moderate content and users</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/moderator">
                        Moderation Tools
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Your Session Info</h4>
                <div className="text-left space-y-2 text-sm text-blue-800">
                  <div><strong>ID:</strong> {user?.id}</div>
                  <div><strong>Email:</strong> {user?.email}</div>
                  <div><strong>Name:</strong> {user?.name}</div>
                  <div><strong>Role:</strong> {user?.role}</div>
                  <div><strong>Email Verified:</strong> {user?.emailVerified ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
