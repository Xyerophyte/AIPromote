"use client"

import { useRequireRole } from "@/hooks/use-auth"
import { UserRole } from "@/types/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPanel() {
  const { hasAccess, isLoading } = useRequireRole([UserRole.ADMIN])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null // Middleware will handle redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div className="flex items-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard" className="text-red-600">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🔐 Admin Dashboard
              </h2>
              <p className="text-gray-600">
                This page is only accessible to users with ADMIN role.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">User Management</h3>
                <p className="text-gray-600 mb-4">Manage all system users and their roles</p>
                <Button size="sm">Manage Users</Button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                <p className="text-gray-600 mb-4">Configure system-wide settings</p>
                <Button size="sm" variant="secondary">Settings</Button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                <p className="text-gray-600 mb-4">View system analytics and reports</p>
                <Button size="sm" variant="outline">View Reports</Button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Content Management</h3>
                <p className="text-gray-600 mb-4">Manage all platform content</p>
                <Button size="sm">Manage Content</Button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Security</h3>
                <p className="text-gray-600 mb-4">Monitor security and access logs</p>
                <Button size="sm" variant="secondary">Security Logs</Button>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Backup & Recovery</h3>
                <p className="text-gray-600 mb-4">Manage system backups</p>
                <Button size="sm" variant="outline">Backups</Button>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Administrator Access</h4>
              <p className="text-red-800 text-sm">
                You have full administrative privileges. Use these tools responsibly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
