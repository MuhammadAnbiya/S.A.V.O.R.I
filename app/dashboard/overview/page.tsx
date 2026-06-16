export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:space-x-4">
        {/* Placeholder for KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Net Sales</h3>
            <p className="mt-1 text-2xl font-semibold text-primary">IDR 0</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Transactions</h3>
            <p className="mt-1 text-2xl font-semibold text-primary">0</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Avg. Transaction</h3>
            <p className="mt-1 text-2xl font-semibold text-primary">IDR 0</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Refunds</h3>
            <p className="mt-1 text-2xl font-semibold text-danger">IDR 0</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Placeholder for charts */}
        <div className="bg-card p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Monthly Revenue</h3>
          <div className="h-48 bg-muted-foreground/5 rounded">Chart Placeholder</div>
        </div>
        <div className="bg-card p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Daily Revenue</h3>
          <div className="h-48 bg-muted-foreground/5 rounded">Chart Placeholder</div>
        </div>
      </div>

      {/* Placeholder for other sections */}
      <div className="bg-card p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Latest Transactions</h3>
        <div className="space-y-2">
          {/* Transaction items would go here */}
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        </div>
      </div>
    </div>
  );
}