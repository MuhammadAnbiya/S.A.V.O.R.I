'use client';

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function HeatmapPerforma() {
  const branches = ['Sudirman', 'Kemang', 'Blok M', 'PIK', 'Kelapa Gading'];
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Generate random heatmap data relative to average
  const heatmapData = branches.map(branch => {
    return days.map(day => {
      // Create some variance, weekends generally higher
      const base = ['Jum', 'Sab', 'Min'].includes(day) ? 1.5 : 0.8;
      const intensity = Math.random() * base; // 0.0 to 1.5
      return {
        branch,
        day,
        intensity: intensity > 1 ? 1 : intensity, // clamp to 1
        value: Math.floor((intensity * 5000000) + 1000000) // 1M to 6M
      };
    });
  });

  // Helper to determine background color based on intensity
  const getBackgroundColor = (intensity: number) => {
    // Opacity scaling of primary color
    if (intensity < 0.2) return 'bg-[#F1F5F9]';
    if (intensity < 0.4) return 'bg-[#BAE6FD]'; // light primary-ish
    if (intensity < 0.6) return 'bg-[#7DD3FC]';
    if (intensity < 0.8) return 'bg-[#38BDF8]';
    return 'bg-[#0284C7] text-white'; // dark primary
  };

  return (
    <Card className="p-6 border border-border shadow-sm bg-white overflow-hidden">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-text-primary">Heatmap Performa Outlet</h3>
        <p className="text-sm text-text-secondary">Intensitas transaksi per hari (Relative vs Average)</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header */}
          <div className="flex">
            <div className="w-32 flex-shrink-0"></div>
            {days.map(day => (
              <div key={day} className="flex-1 text-center text-xs font-semibold text-text-secondary pb-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            <TooltipProvider delayDuration={100}>
              {heatmapData.map((row, i) => (
                <div key={branches[i]} className="flex items-center space-x-1">
                  <div className="w-32 flex-shrink-0 text-sm font-medium text-text-primary truncate pr-2">
                    {branches[i]}
                  </div>
                  {row.map((cell, j) => (
                    <Tooltip key={`${i}-${j}`}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`flex-1 h-10 rounded ${getBackgroundColor(cell.intensity)} transition-opacity hover:opacity-80 cursor-pointer flex items-center justify-center`}
                        >
                          {cell.intensity >= 0.8 && <span className="text-[10px] font-bold">🔥</span>}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-bg-card border-border shadow-lg">
                        <p className="font-bold">{cell.branch} - {cell.day}</p>
                        <p className="text-sm">Rp {cell.value.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-text-secondary mt-1">Intensitas: {(cell.intensity * 100).toFixed(0)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-2 text-xs text-text-secondary">
        <span>Low</span>
        <div className="flex space-x-1">
          <div className="w-4 h-4 rounded bg-[#F1F5F9]"></div>
          <div className="w-4 h-4 rounded bg-[#BAE6FD]"></div>
          <div className="w-4 h-4 rounded bg-[#7DD3FC]"></div>
          <div className="w-4 h-4 rounded bg-[#38BDF8]"></div>
          <div className="w-4 h-4 rounded bg-[#0284C7]"></div>
        </div>
        <span>High</span>
      </div>
    </Card>
  );
}
