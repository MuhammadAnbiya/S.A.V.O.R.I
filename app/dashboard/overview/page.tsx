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
          {/* Caption label — coral uppercase */}
          <p style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#cc785c', marginBottom: '0.25rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            Business Intelligence
          </p>
          {/* Serif display headline */}
          <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '2.25rem', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#141413' }}>
            Dashboard Overview
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#6c6a64', marginTop: '0.25rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            Analisis komprehensif performa penjualan, outlet, dan produk S.A.V.O.R.I.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '36px', padding: '0 0.875rem', borderRadius: '0.5rem', border: '1px solid #e6dfd8', backgroundColor: '#faf9f5', color: '#3d3d3a', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
          >
            <CalendarIcon className="w-4 h-4" /> Bulan Ini
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '36px', padding: '0 0.875rem', borderRadius: '0.5rem', border: '1px solid #e6dfd8', backgroundColor: '#faf9f5', color: '#3d3d3a', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '36px', padding: '0 0.875rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#cc785c', color: '#ffffff', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
          >
            <Download className="w-4 h-4" /> Export
          </button>
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