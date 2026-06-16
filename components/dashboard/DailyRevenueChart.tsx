'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function DailyRevenueChart() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/analytics/daily-revenue');
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatRp = (val: number) => `${(val / 1000).toFixed(0)}k`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const actual = payload.find((p: any) => p.dataKey === 'net_sales')?.value || 0;
      const prev = payload.find((p: any) => p.dataKey === 'prev_period_sales')?.value || 0;
      const delta = prev > 0 ? ((actual - prev) / prev * 100).toFixed(1) : 0;
      
      return (
        <div className="bg-white p-3 border border-border shadow-lg rounded-lg">
          <p className="font-bold text-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">Rp {entry.value.toLocaleString('id-ID')}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-border text-sm flex justify-between">
            <span className="text-text-secondary">Delta vs Prev:</span>
            <span className={`font-bold ${Number(delta) >= 0 ? 'text-success' : 'text-danger'}`}>
              {Number(delta) > 0 ? '+' : ''}{delta}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 border border-border shadow-sm h-[400px] flex flex-col bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Performa Harian & Forecast</h3>
          <p className="text-sm text-text-secondary">7 Hari Terakhir</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="w-full h-full animate-pulse bg-main rounded-md"></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={formatRp}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Area type="monotone" dataKey="prev_period_sales" name="Periode Lalu" stroke="#94A3B8" fillOpacity={1} fill="url(#colorPrev)" />
              <Area type="monotone" dataKey="net_sales" name="Actual Sales" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
              
              <Line type="monotone" dataKey="target" name="Target Harian" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="forecast" name="Forecast AI" stroke="#64748B" strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
