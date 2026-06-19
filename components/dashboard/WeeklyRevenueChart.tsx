'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { parsePOSDate } from '@/lib/csv-parser';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function WeeklyRevenueChart() {
  const { data } = useCSVData();

  const chartData = useMemo(() => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    if (!data || data.length === 0) {
      return [
        { name: 'Senin', revenue: 1500000 },
        { name: 'Selasa', revenue: 1200000 },
        { name: 'Rabu', revenue: 1600000 },
        { name: 'Kamis', revenue: 1400000 },
        { name: 'Jumat', revenue: 2200000 },
        { name: 'Sabtu', revenue: 3500000 },
        { name: 'Minggu', revenue: 3100000 }
      ];
    }

    const dayMap = new Map<string, number>();
    days.forEach(d => dayMap.set(d, 0));

    data.forEach(row => {
      if (row.totalPenjualan <= 0) return;
      if (!row.tanggalPenjualan) return;

      let dateObj = parsePOSDate(row.tanggalPenjualan);
      if (dateObj) {
        // getDay: 0 = Sunday, 1 = Monday ... 6 = Saturday
        let dayIdx = dateObj.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday
        const dayName = days[dayIdx];
        dayMap.set(dayName, (dayMap.get(dayName) || 0) + row.totalPenjualan);
      }
    });

    return days.map(day => ({ name: day, revenue: dayMap.get(day) || 0 }));
  }, [data]);

  const formatRp = (val: number) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}K`;
    return `Rp ${val}`;
  };

  const hasData = data.length > 0;
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0);

  return (
    <Card className={`p-6 border shadow-sm h-[400px] flex flex-col bg-white transition-opacity ${hasData ? 'border-border opacity-100' : 'border-border/50 opacity-80'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Pendapatan Berdasarkan Hari</h3>
          <p className="text-sm text-text-secondary">Total revenue dari Senin hingga Minggu</p>
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
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
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
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.revenue === maxRevenue && maxRevenue > 0 ? 'var(--accent)' : '#94A3B8'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
