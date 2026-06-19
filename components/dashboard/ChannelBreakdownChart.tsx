'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#cc785c', '#5db8a6', '#e8a55a', '#1A3C5E', '#94A3B8'];

export default function ChannelBreakdownChart() {
  const { data } = useCSVData();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { name: 'Dine In', value: 350000 },
        { name: 'Take Away', value: 250000 },
        { name: 'GrabFood', value: 180000 },
        { name: 'GoFood', value: 120000 }
      ];
    }

    const channelMap = new Map<string, number>();

    data.forEach(row => {
      if (row.totalPenjualan <= 0) return;
      const channel = row.tipePesanan || 'Lainnya';
      const current = channelMap.get(channel) || 0;
      channelMap.set(channel, current + row.totalPenjualan);
    });

    const sortedData = Array.from(channelMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group small ones into "Lainnya" if there are too many
    if (sortedData.length > 5) {
      const top4 = sortedData.slice(0, 4);
      const others = sortedData.slice(4).reduce((sum, item) => sum + item.value, 0);
      return [...top4, { name: 'Lainnya', value: others }];
    }

    return sortedData;
  }, [data]);

  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const hasData = data.length > 0;

  return (
    <Card className={`p-6 border shadow-sm h-[400px] flex flex-col bg-white transition-opacity ${hasData ? 'border-border opacity-100' : 'border-border/50 opacity-80'}`}>
      <div className="mb-2">
        <h3 className="font-bold text-lg text-text-primary">Distribusi Channel Pesanan</h3>
        <p className="text-sm text-text-secondary">Berdasarkan total pendapatan</p>
      </div>
      
      <div className="flex-1 w-full min-h-0 relative flex flex-col justify-between">
        {!hasData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
              <p className="text-xs font-semibold text-text-secondary">Demo Data</p>
            </div>
          </div>
        )}
        
        <div className={`h-[200px] flex-shrink-0 ${!hasData ? "grayscale opacity-40" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => 
                  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
                }
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Clean Grid Legend */}
        <div className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t pt-4 ${!hasData ? "grayscale opacity-40" : ""}`}>
          {chartData.map((entry, index) => {
            const percentage = totalValue > 0 ? ((entry.value / totalValue) * 100).toFixed(1) : '0.0';
            const color = COLORS[index % COLORS.length];
            const formattedCompact = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(entry.value);

            return (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: color }}></span>
                  <span className="truncate text-text-primary font-medium">{entry.name}</span>
                </div>
                <div className="text-right flex items-center gap-1.5 font-bold text-text-secondary">
                  <span>{percentage}%</span>
                  <span className="text-[10px] text-text-tertiary font-normal">
                    ({formattedCompact})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
