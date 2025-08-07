"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPanel() {
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
                Administration tools will be available after full deployment.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  This is a simplified version for deployment. Full admin functionality will be restored soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
