'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ArrowUpRight } from 'lucide-react';

export default function MultiChannelAnalysis() {
  const channelData = [
    { name: 'Dine-in', value: 45 },
    { name: 'Take Away', value: 20 },
    { name: 'Online Order', value: 35 },
  ];

  const onlineBreakdown = [
    { name: 'GrabFood', percent: 45 },
    { name: 'GoFood', percent: 35 },
    { name: 'Shopee Food', percent: 20 },
  ];

  const topOutlets = [
    { rank: 1, name: 'Cabang Sudirman', sales: 45000000, growth: 12.5 },
    { rank: 2, name: 'Cabang Kemang', sales: 38000000, growth: 8.2 },
    { rank: 3, name: 'Pusat Blok M', sales: 35000000, growth: 5.0 },
    { rank: 4, name: 'Cabang PIK', sales: 28000000, growth: -2.1 },
    { rank: 5, name: 'Cabang Kelapa Gading', sales: 22000000, growth: 1.5 },
  ];

  const COLORS = ['var(--primary)', '#94A3B8', 'var(--accent)'];

  return (
    <Card className="p-6 border border-border shadow-sm bg-white">
      <h3 className="font-bold text-lg text-text-primary mb-6">Channel & Outlet Analysis</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Channel Donut */}
        <div className="flex flex-col">
          <h4 className="font-semibold text-sm text-text-secondary uppercase mb-2">Jenis Penjualan</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${value}%`, 'Proporsi']} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {onlineBreakdown.map((platform) => (
              <div key={platform.name} className="bg-main p-2 rounded">
                <span className="block text-text-secondary">{platform.name}</span>
                <span className="font-bold text-primary">{platform.percent}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary text-center mt-3">Breakdown channel <b>Online Order</b></p>
        </div>

        {/* Outlet Ranking */}
        <div>
          <h4 className="font-semibold text-sm text-text-secondary uppercase mb-3 border-b pb-2">Top Outlet Ranking</h4>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-text-secondary">
                <th className="pb-2 w-10">Rnk</th>
                <th className="pb-2">Nama Cabang</th>
                <th className="pb-2 text-right">Net Sales</th>
                <th className="pb-2 text-right">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topOutlets.map((outlet) => (
                <tr key={outlet.rank} className="hover:bg-main/50 cursor-pointer transition-colors group">
                  <td className="py-3 text-lg">
                    {outlet.rank === 1 ? '🥇' : outlet.rank === 2 ? '🥈' : outlet.rank === 3 ? '🥉' : <span className="text-sm text-text-secondary ml-1">#{outlet.rank}</span>}
                  </td>
                  <td className="py-3 font-medium group-hover:text-primary">{outlet.name}</td>
                  <td className="py-3 text-right">Rp {(outlet.sales/1000000).toFixed(1)}M</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${outlet.growth >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {outlet.growth > 0 && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                      {outlet.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
