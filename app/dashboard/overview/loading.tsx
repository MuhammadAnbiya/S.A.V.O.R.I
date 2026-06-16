import { Card } from "@/components/ui/card";

export default function OverviewLoading() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-64 bg-main border border-border animate-pulse rounded mb-2"></div>
          <div className="h-4 w-96 bg-main border border-border animate-pulse rounded"></div>
        </div>
      </div>

      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6 h-32 bg-main animate-pulse border-border shadow-sm"></Card>
        ))}
      </div>

      {/* Chart Skeletons */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 h-[400px] bg-main animate-pulse border-border shadow-sm"></Card>
        <Card className="p-6 h-[400px] bg-main animate-pulse border-border shadow-sm"></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 h-[350px] bg-main animate-pulse border-border shadow-sm"></Card>
        <Card className="p-6 h-[350px] bg-main animate-pulse border-border shadow-sm"></Card>
      </div>
    </div>
  );
}
