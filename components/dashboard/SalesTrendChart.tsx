'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { parsePOSDate } from '@/lib/csv-parser';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

export default function SalesTrendChart() {
  const { data } = useCSVData();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

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

  const hasData = chartData.length > 0;

  return (
    <Card className="p-6 border border-border shadow-sm bg-white h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-text-primary">Tren Penjualan Harian</h3>
        <p className="text-sm text-text-secondary">Total pendapatan kotor per hari</p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Pendapatan"
                stroke="#cc785c" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border rounded-xl bg-main/30">
            <TrendingUp className="w-8 h-8 text-text-secondary/30 mb-3" />
            <p className="text-sm text-text-secondary/60 font-medium">Tren Penjualan</p>
            <p className="text-xs text-text-secondary/40 mt-1">Unggah file CSV untuk melihat grafik</p>
          </div>
        )}
      </div>
    </Card>
  );
}
