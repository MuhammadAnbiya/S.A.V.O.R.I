'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function HourlyRevenueChart() {
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');

  // Fixed mock data for Hourly to prevent hydration mismatch
  const data = [
    { hour: "08:00", count: 12, amount: 450000 },
    { hour: "09:00", count: 18, amount: 650000 },
    { hour: "10:00", count: 15, amount: 550000 },
    { hour: "11:00", count: 22, amount: 850000 },
    { hour: "12:00", count: 68, amount: 2850000 }, // Peak
    { hour: "13:00", count: 55, amount: 2150000 }, // Peak
    { hour: "14:00", count: 25, amount: 950000 },
    { hour: "15:00", count: 18, amount: 720000 },
    { hour: "16:00", count: 20, amount: 800000 },
    { hour: "17:00", count: 35, amount: 1450000 },
    { hour: "18:00", count: 75, amount: 3150000 }, // Peak
    { hour: "19:00", count: 82, amount: 3550000 }, // Peak
    { hour: "20:00", count: 45, amount: 1850000 },
    { hour: "21:00", count: 28, amount: 1150000 },
    { hour: "22:00", count: 12, amount: 480000 },
  ];

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
              formatter={(value: any) => metric === 'amount' 
                ? [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value), 'Pendapatan']
                : [value, 'Transaksi']
              }
              cursor={{ fill: '#F1F5F9' }}
            />
            <Bar dataKey={metric} radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#64748B', fontSize: 10, formatter: (val: any) => metric === 'amount' ? `${(val/1000).toFixed(0)}k` : val }}>
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
