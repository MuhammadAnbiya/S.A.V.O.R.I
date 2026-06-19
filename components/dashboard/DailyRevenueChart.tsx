'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { parsePOSDate } from '@/lib/csv-parser';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DailyRevenueChart() {
  const { data } = useCSVData();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Demo data
      return [
        { date: '10 Jun', revenue: 1200000 },
        { date: '11 Jun', revenue: 1500000 },
        { date: '12 Jun', revenue: 1100000 },
        { date: '13 Jun', revenue: 1800000 },
        { date: '14 Jun', revenue: 2200000 },
        { date: '15 Jun', revenue: 2600000 },
        { date: '16 Jun', revenue: 1900000 },
      ];
    }

    const dailyMap = new Map<string, number>();

    data.forEach(row => {
      if (row.totalPenjualan <= 0) return;
      if (!row.tanggalPenjualan) return;

      let dateObj = parsePOSDate(row.tanggalPenjualan);

      if (dateObj) {
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        const current = dailyMap.get(dateStr) || 0;
        dailyMap.set(dateStr, current + row.totalPenjualan);
      }
    });

    const sortedData = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({
        rawDate: date,
        date: format(new Date(date), 'dd MMM', { locale: id }),
        revenue
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

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
      <div className="mb-6">
        <h3 className="font-bold text-lg text-text-primary">Performa Harian</h3>
        <p className="text-sm text-text-secondary">Tren pendapatan kotor harian</p>
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
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#cc785c" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#cc785c" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              dy={10} 
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickFormatter={formatRp}
              dx={-10}
            />
            <Tooltip 
              formatter={(value: any) => hasData ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : 'Rp 0'}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              name="Pendapatan (Rp)"
              stroke="#cc785c" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
