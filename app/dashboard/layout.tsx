import '../globals.css'; // Import the global CSS from the app directory

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-main">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex-shrink-0">
        <div className="p-4">
          <h2 className="text-xl font-bold">SAVORI</h2>
          <nav className="mt-6 space-y-2">
            <a href="/dashboard/overview" className="px-3 py-2 rounded text-sm font-medium hover:bg-primary-light">
              Overview
            </a>
            {/* We'll add more links later */}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-primary-light flex items-center px-4 text-sm">
          <div className="flex-1">Dashboard</div>
          <div className="flex items-center space-x-3">
            {/* Placeholder for user profile */}
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}