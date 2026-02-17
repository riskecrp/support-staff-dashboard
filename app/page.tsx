export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Support Staff Dashboard
          </h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">
              Welcome to the Support Staff Dashboard. This system manages staff activity tracking, 
              strikes, and leave of absence (LOA) with automated quota calculations.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/staff"
                className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <h3 className="text-lg font-semibold text-blue-900">Staff Management</h3>
                <p className="mt-2 text-sm text-blue-700">
                  View and manage support staff members
                </p>
              </a>
              <a
                href="/stats"
                className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
              >
                <h3 className="text-lg font-semibold text-purple-900">Monthly Stats</h3>
                <p className="mt-2 text-sm text-purple-700">
                  View current month performance with quotas
                </p>
              </a>
              <a
                href="https://github.com/riskecrp/support-staff-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
                <p className="mt-2 text-sm text-gray-700">
                  API docs, setup guide, and migration info
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
