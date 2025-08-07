import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center justify-center w-full h-12 px-8 text-base font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Go to homepage
          </Link>
          
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-slate-900 bg-white border-2 border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Go to dashboard
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            If you think this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
