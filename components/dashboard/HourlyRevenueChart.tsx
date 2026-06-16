'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function HourlyRevenueChart() {
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');

  // Mock data for Hourly
  const data = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8; // 08:00 to 22:00
    // Peak hours: 12, 13, 18, 19
    const isPeak = [12, 13, 18, 19].includes(hour);
    const count = isPeak ? Math.floor(Math.random() * 30 + 50) : Math.floor(Math.random() * 20 + 10);
    const amount = count * Math.floor(Math.random() * 20000 + 30000); // 30k-50k per trx
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
      amount
    };
  });

  const sortedByMetric = [...data].sort((a, b) => b[metric] - a[metric]);
  const peakHours = sortedByMetric.slice(0, 3).map(d => d.hour);

  return (
    <Card className="p-6 border border-border shadow-sm h-[350px] flex flex-col bg-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Jam Sibuk (Peak Hours)</h3>
          <p className="text-sm text-text-secondary">Insight aktivitas harian</p>
        </div>
        <select 
          value={metric} 
          onChange={(e) => setMetric(e.target.value as 'amount' | 'count')}
          className="border border-border rounded-md px-2 py-1 text-xs bg-main text-text-primary focus:outline-none"
        >
          <option value="amount">Nominal (Rp)</option>
          <option value="count">Jml Transaksi</option>
        </select>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis 
              type="number" 
              hide={true} 
            />
            <YAxis 
              dataKey="hour" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 10 }}
              width={40}
            />
            <Tooltip 
              formatter={(value: number) => metric === 'amount' 
                ? [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value), 'Pendapatan']
                : [value, 'Transaksi']
              }
              cursor={{ fill: '#F1F5F9' }}
            />
            <Bar dataKey={metric} radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#64748B', fontSize: 10, formatter: (val: number) => metric === 'amount' ? `${(val/1000).toFixed(0)}k` : val }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={peakHours.includes(entry.hour) ? 'var(--accent)' : '#CBD5E1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 text-xs bg-accent/10 text-accent p-2 rounded flex justify-between items-center">
        <span><b>Insight:</b> Jam tersibuk di {peakHours[0]} dengan {sortedByMetric[0].count} transaksi.</span>
      </div>
    </Card>
  );
}
