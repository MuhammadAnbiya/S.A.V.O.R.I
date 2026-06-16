  'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function MonthlyRevenueChart() {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('tahunan');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/analytics/monthly-revenue');
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  const formatRp = (val: number) => `Rp ${(val / 1000000).toFixed(1)}M`;

  return (
    <Card className="p-6 border border-border shadow-sm h-[400px] flex flex-col bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Tren Pendapatan Bulanan</h3>
          <p className="text-sm text-text-secondary">Actual vs Target vs Prev Year</p>
        </div>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-main text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="tahunan">Tahunan</option>
          <option value="semesteran">Semesteran</option>
          <option value="kuartalan">Kuartalan</option>
        </select>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="w-full h-full animate-pulse bg-main rounded-md"></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={formatRp}
                dx={-10}
              />
              <Tooltip 
                formatter={(value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)}
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="prev_year_revenue" name="Tahun Lalu" fill="#94A3B8" opacity={0.5} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="actual_revenue" name="Actual" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="target" name="Target" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: 'var(--accent)' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
