'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';

export default function WeeklyRevenueChart() {
  // Mock data for Weekly
  const data = [
    { day: 'Sen', sales: 1200000 },
    { day: 'Sel', sales: 1100000 },
    { day: 'Rab', sales: 1300000 },
    { day: 'Kam', sales: 1500000 },
    { day: 'Jum', sales: 2500000 },
    { day: 'Sab', sales: 3500000 }, // Peak
    { day: 'Min', sales: 3000000 },
  ];

  const maxSales = Math.max(...data.map(d => d.sales));
  const avgSales = data.reduce((sum, d) => sum + d.sales, 0) / data.length;

  return (
    <Card className="p-6 border border-border shadow-sm h-[350px] flex flex-col bg-white">
      <div className="mb-4">
        <h3 className="font-bold text-lg text-text-primary">Performa Mingguan</h3>
        <p className="text-sm text-text-secondary">Distribusi pendapatan per hari</p>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: number) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value), 'Pendapatan']}
              cursor={{ fill: '#F1F5F9' }}
            />
            <ReferenceLine y={avgSales} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'top', value: 'Avg', fill: '#94A3B8', fontSize: 10 }} />
            <Bar dataKey="sales" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (val: number) => `${(val/1000000).toFixed(1)}M`, fill: '#64748B', fontSize: 10 }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.sales === maxSales ? 'var(--primary)' : 'var(--primary-light)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
