'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Clock } from 'lucide-react';

export default function PeakHoursChart() {
  const { data } = useCSVData();

  const chartData = useMemo(() => {
    const hoursMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hoursMap.set(i, 0);

    if (!data || data.length === 0) {
      // Mock curve for demo
      const mockCurve = [1, 0, 0, 0, 0, 0, 2, 8, 15, 22, 25, 30, 45, 35, 20, 15, 18, 25, 40, 50, 35, 15, 5, 2];
      return Array.from(hoursMap.entries()).map(([hour, count], idx) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count: mockCurve[idx]
      }));
    }

    const uniqueTxns = new Set<string>();

    data.forEach(row => {
      if (row.totalPenjualan <= 0) return;
      if (!row.waktuPenjualan || !row.noPenjualan) return;
      
      // Count unique transactions per hour to avoid double counting items in same txn
      if (uniqueTxns.has(row.noPenjualan)) return;
      uniqueTxns.add(row.noPenjualan);

      // Parse time "HH:MM" or "H:MM"
      const parts = row.waktuPenjualan.split(':');
      if (parts.length >= 2) {
        const hour = parseInt(parts[0], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
        }
      }
    });

    const result = Array.from(hoursMap.entries()).map(([hour, count]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count
    }));

    return result;
  }, [data]);

  const maxCount = Math.max(...chartData.map(d => d.count), 0);
  const hasData = data.length > 0;

  return (
    <Card className={`p-6 border shadow-sm h-[400px] flex flex-col bg-white transition-opacity ${hasData ? 'border-border opacity-100' : 'border-border/50 opacity-80'}`}>
      <div className="mb-6">
        <h3 className="font-bold text-lg text-text-primary">Jam Sibuk Transaksi</h3>
        <p className="text-sm text-text-secondary">Volume transaksi per jam operasional</p>
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
            <XAxis 
              dataKey="hour" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              dy={10} 
              interval={1}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip 
              formatter={(value: any) => [hasData ? `${value} Transaksi` : '0 Transaksi', 'Volume']}
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.count === maxCount && maxCount > 0 ? 'var(--accent)' : 'var(--primary)'} 
                  fillOpacity={entry.count === maxCount ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
