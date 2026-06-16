import '../globals.css'; // Import the global CSS from the app directory

import TalkToDataPanel from '@/components/chat/TalkToDataPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-main text-text-primary">
      {/* Sidebar (Placeholder for now) */}
      <aside className="w-64 bg-white border-r border-border hidden md:block">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold tracking-tight text-primary">S.A.V.O.R.I</h2>
        </div>
        <nav className="mt-6 space-y-2 px-2">
          <a href="/dashboard/overview" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-main text-text-secondary hover:text-primary transition-colors">
            Overview
          </a>
          <a href="/dashboard/input-data" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-main text-text-secondary hover:text-primary transition-colors">
            Input Data
          </a>
          <a href="/dashboard/database" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-main text-text-secondary hover:text-primary transition-colors">
            Database Transaksi
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center px-4 text-sm z-10 shadow-sm">
          <div className="flex-1 font-semibold text-text-primary">Dashboard</div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Talk to Data AI Panel */}
      <TalkToDataPanel />
    </div>
  );
}