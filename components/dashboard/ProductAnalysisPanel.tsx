'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';

export default function ProductAnalysisPanel() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/analytics/product-analysis');
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

  if (isLoading) {
    return <Card className="p-6 border border-border shadow-sm h-[600px] animate-pulse bg-main rounded-md"></Card>;
  }

  if (!data) return null;

  return (
    <Card className="p-6 border border-border shadow-sm bg-white">
      <h3 className="font-bold text-lg text-text-primary mb-6">Analisis Produk & Menu</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Top Products */}
          <div>
            <h4 className="font-semibold text-sm text-text-secondary uppercase mb-3 border-b pb-2">Top 5 Produk (Bintang)</h4>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-text-secondary">
                  <th className="pb-2 w-10">No</th>
                  <th className="pb-2">Nama Produk</th>
                  <th className="pb-2 text-right">Vol</th>
                  <th className="pb-2 text-right">Rev %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_products.map((p: any) => (
                  <tr key={p.rank}>
                    <td className="py-2 font-bold text-primary">#{p.rank}</td>
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 text-right">{p.volume.toLocaleString('id-ID')}</td>
                    <td className="py-2 text-right">{p.contribution}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Products */}
          <div>
            <h4 className="font-semibold text-sm text-text-secondary uppercase mb-3 border-b pb-2 mt-4">Bottom Produk (Perlu Evaluasi)</h4>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-text-secondary">
                  <th className="pb-2 w-10">No</th>
                  <th className="pb-2">Nama Produk</th>
                  <th className="pb-2 text-right">Drop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.bottom_products.map((p: any) => (
                  <tr key={p.rank}>
                    <td className="py-2 text-text-secondary">#{p.rank}</td>
                    <td className="py-2 flex items-center gap-2">
                      {p.name}
                      {p.drop > 20 && <span title="Turun drastis >20%"><AlertTriangle className="w-3 h-3 text-warning" /></span>}
                    </td>
                    <td className="py-2 text-right text-danger">-{p.drop}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BCG Matrix Donut */}
        <div className="flex flex-col items-center justify-center">
          <h4 className="font-semibold text-sm text-text-secondary uppercase mb-2 w-full text-center">Matriks BCG (Sebaran Produk)</h4>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.bcg_matrix}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.bcg_matrix.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${value} Produk`, 'Jumlah']} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-text-secondary text-center mt-4 max-w-xs">
            Sebagian besar produk (40%) adalah <b>Plowhorse</b> (volume tinggi, margin rendah). Perlu strategi up-selling.
          </p>
        </div>
      </div>
    </Card>
  );
}
