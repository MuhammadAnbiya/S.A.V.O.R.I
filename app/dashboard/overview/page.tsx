import { Suspense } from "react";
import KPICardGrid from "@/components/dashboard/KPICardGrid";
import MonthlyRevenueChart from "@/components/dashboard/MonthlyRevenueChart";
import DailyRevenueChart from "@/components/dashboard/DailyRevenueChart";
import WeeklyRevenueChart from "@/components/dashboard/WeeklyRevenueChart";
import HourlyRevenueChart from "@/components/dashboard/HourlyRevenueChart";
import ProductAnalysisPanel from "@/components/dashboard/ProductAnalysisPanel";
import MultiChannelAnalysis from "@/components/dashboard/MultiChannelAnalysis";
import HeatmapPerforma from "@/components/dashboard/HeatmapPerforma";
import { Download, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Business Intelligence</h1>
          <p className="text-sm text-text-secondary mt-1">
            Analisis komprehensif performa penjualan, outlet, dan produk S.A.V.O.R.I.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">
            <CalendarIcon className="w-4 h-4 mr-2" /> Bulan Ini
          </Button>
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button className="bg-primary hover:bg-primary-hover text-white">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<div className="h-32 bg-main animate-pulse rounded-lg"></div>}>
        <KPICardGrid />
      </Suspense>

      {/* Revenue Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyRevenueChart />
        <DailyRevenueChart />
      </div>

      {/* Activity Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyRevenueChart />
        <HourlyRevenueChart />
      </div>

      {/* Products & Channels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProductAnalysisPanel />
        <div className="space-y-6">
          <MultiChannelAnalysis />
          <HeatmapPerforma />
        </div>
      </div>
    </div>
  );
}