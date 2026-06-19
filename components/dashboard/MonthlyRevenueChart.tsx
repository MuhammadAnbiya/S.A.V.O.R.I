'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { parsePOSDate } from '@/lib/csv-parser';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function MonthlyRevenueChart() {
  const { data } = useCSVData();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { month: 'Jan', actual_revenue: 15000000 },
        { month: 'Feb', actual_revenue: 18000000 },
        { month: 'Mar', actual_revenue: 16500000 },
        { month: 'Apr', actual_revenue: 22000000 },
        { month: 'Mei', actual_revenue: 21000000 },
        { month: 'Jun', actual_revenue: 25000000 },
      ];
    }

    const monthMap = new Map<string, number>();

    data.forEach(row => {
      if (row.totalPenjualan <= 0) return;
      if (!row.tanggalPenjualan) return;

      let dateObj = parsePOSDate(row.tanggalPenjualan);
      if (dateObj) {
        const monthYear = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
        const current = monthMap.get(monthYear) || 0;
        monthMap.set(monthYear, current + row.totalPenjualan);
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const sortedData = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, rev]) => {
        const [year, m] = key.split('-');
        return {
          month: `${monthNames[parseInt(m, 10) - 1]} ${year}`,
          actual_revenue: rev
        };
      });

    return sortedData;
  }, [data]);

  const formatRp = (val: number) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}K`;
    return `Rp ${val}`;
  };

  const hasData = data.length > 0;

  return (
    <Card className={`p-6 border shadow-sm h-[400px] flex flex-col bg-white transition-opacity ${hasData ? 'border-border opacity-100' : 'border-border/50 opacity-80'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Tren Pendapatan Bulanan</h3>
          <p className="text-sm text-text-secondary">Akumulasi pendapatan per bulan</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        {!hasData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
              <p className="text-xs font-semibold text-text-secondary">Demo Data</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%" className={!hasData ? "grayscale opacity-40" : ""}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickFormatter={formatRp}
              dx={-10}
            />
            <Tooltip 
              formatter={(value: any) => hasData ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : 'Rp 0'}
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="actual_revenue" name="Actual Sales (Rp)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
