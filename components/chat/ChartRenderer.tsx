'use client';

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ChartRenderer({ chartType, data }: { chartType: string, data: any[] }) {
  if (!data || data.length === 0) return null;

  // Attempt to guess keys if standard keys aren't used
  const keys = Object.keys(data[0] || {});
  const labelKey = keys[0]; // Usually the first column is the label/category
  const valueKey = keys[1]; // The second column is usually the value

  const COLORS = ['var(--primary)', '#94A3B8', 'var(--accent)', '#38BDF8', '#F59E0B'];

  switch (chartType) {
    case 'bar':
      return (
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={labelKey} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey={valueKey} fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    case 'line':
      return (
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={labelKey} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey={valueKey} stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    case 'pie':
      return (
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey={valueKey}
                nameKey={labelKey}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    case 'table':
      return (
        <div className="w-full overflow-x-auto mt-4 border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-main text-text-secondary border-b">
              <tr>
                {keys.map(k => <th key={k} className="px-4 py-2 capitalize">{k.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-main/30">
                  {keys.map(k => (
                    <td key={k} className="px-4 py-2">
                      {typeof row[k] === 'number' ? row[k].toLocaleString('id-ID') : row[k]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
