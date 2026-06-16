import { Card } from "@/components/ui/card";

export default function DatabaseLoading() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-main animate-pulse rounded mb-2"></div>
          <div className="h-4 w-72 bg-main animate-pulse rounded"></div>
        </div>
        <div className="h-10 w-32 bg-main animate-pulse rounded"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Skeleton */}
        <Card className="w-full lg:w-72 h-[600px] p-4 bg-main animate-pulse border-border shadow-sm"></Card>

        {/* Table Skeleton */}
        <Card className="flex-1 w-full h-[600px] p-4 bg-main animate-pulse border-border shadow-sm flex flex-col gap-4">
          <div className="h-10 w-full bg-white/50 rounded"></div>
          {[1,2,3,4,5,6,7,8].map(i => (
             <div key={i} className="h-14 w-full bg-white/30 rounded"></div>
          ))}
        </Card>
      </div>
    </div>
  );
}
