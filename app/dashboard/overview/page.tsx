'use client';

import SalesKPICards from "@/components/dashboard/SalesKPICards";
import DailyRevenueChart from "@/components/dashboard/DailyRevenueChart";
import MonthlyRevenueChart from "@/components/dashboard/MonthlyRevenueChart";
import WeeklyRevenueChart from "@/components/dashboard/WeeklyRevenueChart";
import PeakHoursChart from "@/components/dashboard/PeakHoursChart";
import ChannelBreakdownChart from "@/components/dashboard/ChannelBreakdownChart";
import HeatmapPerforma from "@/components/dashboard/HeatmapPerforma";
import ForecastingPanel from "@/components/dashboard/ForecastingPanel";
import CSVUploader from "@/components/dashboard/CSVUploader";
import { useCSVData, TimeFilterType } from '@/lib/csv-context';
import { Download, Calendar as CalendarIcon, Filter, Info } from "lucide-react";

export default function OverviewPage() {
  const { data, timeFilter, setTimeFilter, selectedOutlet, setSelectedOutlet, outlets, fileName } = useCSVData();
  const hasData = data.length > 0;

  const handleExportCSV = () => {
    if (!hasData) return;

    // Prepare CSV header and content
    let csvContent = "\uFEFF"; // UTF-8 BOM to prevent Indonesian character mangling in Excel
    csvContent += "No. Penjualan,Tanggal,Waktu,Lokasi,Tipe Pesanan,Total Penjualan\n";
    
    data.forEach(row => {
      // Escape values to ensure clean CSV
      const noPenjualan = (row.noPenjualan || '').replace(/"/g, '""');
      const tanggal = (row.tanggalPenjualan || '').replace(/"/g, '""');
      const waktu = (row.waktuPenjualan || '').replace(/"/g, '""');
      const lokasi = (row.lokasi || '').replace(/"/g, '""');
      const tipe = (row.tipePesanan || '').replace(/"/g, '""');
      const total = row.totalPenjualan || 0;

      csvContent += `"${noPenjualan}","${tanggal}","${waktu}","${lokasi}","${tipe}",${total}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const filterSuffix = timeFilter === 'all' ? 'semua' : timeFilter;
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "savori_report";
    link.setAttribute("download", `${baseName}_terfilter_${filterSuffix}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#cc785c', marginBottom: '0.25rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            Business Intelligence
          </p>
          <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '2.25rem', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#141413' }}>
            S.A.V.O.R.I Super Dashboard
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#6c6a64', marginTop: '0.25rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            Analisis performa penjualan, prediksi AI, dan visualisasi interaktif dari data kasir Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Time Filter Dropdown (Bulan Ini) */}
          <div className="relative flex items-center">
            <CalendarIcon className="absolute left-3 w-4 h-4 text-[#6c6a64] pointer-events-none z-10" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilterType)}
              disabled={!hasData}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                padding: '0 1.75rem 0 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid #e6dfd8',
                backgroundColor: '#ffffff',
                color: '#3d3d3a',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                outline: 'none',
                appearance: 'none',
              }}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#faf9f5] transition-colors shadow-sm"
            >
              <option value="all">Semua Waktu</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="thismonth">Bulan Ini</option>
            </select>
            <span className="absolute right-3 pointer-events-none text-[#6c6a64] text-[8px]">▼</span>
          </div>

          {/* Outlet Filter Dropdown (Filter) */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-[#6c6a64] pointer-events-none z-10" />
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              disabled={!hasData || outlets.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                padding: '0 1.75rem 0 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid #e6dfd8',
                backgroundColor: '#ffffff',
                color: '#3d3d3a',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                outline: 'none',
                appearance: 'none',
                maxWidth: '180px',
              }}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#faf9f5] transition-colors shadow-sm truncate"
            >
              <option value="all">Semua Cabang</option>
              {outlets.map((outlet) => (
                <option key={outlet} value={outlet}>
                  {outlet}
                </option>
              ))}
            </select>
            <span className="absolute right-3 pointer-events-none text-[#6c6a64] text-[8px]">▼</span>
          </div>

          {/* Export Button (Coral Solid) */}
          <button
            onClick={handleExportCSV}
            disabled={!hasData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              height: '36px',
              padding: '0 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#cc785c',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
            }}
            className="disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b06349] transition-colors shadow-sm flex-shrink-0"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* CSV Uploader Section */}
      <CSVUploader />

      {!hasData && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-primary">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Anda sedang melihat preview layout dashboard dengan Demo Data. Unggah file CSV POS Anda pada area di atas untuk mulai melihat angka dan grafik riil bisnis Anda!</p>
        </div>
      )}

      {/* KPI Cards */}
      <SalesKPICards />

      {/* Main Revenue Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyRevenueChart />
        <DailyRevenueChart />
      </div>

      {/* Activity Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyRevenueChart />
        <PeakHoursChart />
      </div>

      {/* Channels & Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChannelBreakdownChart />
        <HeatmapPerforma />
      </div>

      {/* AI Features */}
      <div className="pt-8 border-t border-border mt-8">
        <ForecastingPanel />
      </div>
    </div>
  );
}