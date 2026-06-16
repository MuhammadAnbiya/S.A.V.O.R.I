'use client';

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function HeatmapPerforma() {
  const branches = ['Sudirman', 'Kemang', 'Blok M', 'PIK', 'Kelapa Gading'];
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Fixed heatmap data to prevent hydration mismatch
  const heatmapData = [
    // Sudirman
    [
      { branch: 'Sudirman', day: 'Sen', intensity: 0.6, value: 3100000 },
      { branch: 'Sudirman', day: 'Sel', intensity: 0.5, value: 2800000 },
      { branch: 'Sudirman', day: 'Rab', intensity: 0.7, value: 3500000 },
      { branch: 'Sudirman', day: 'Kam', intensity: 0.8, value: 4200000 },
      { branch: 'Sudirman', day: 'Jum', intensity: 1.0, value: 5500000 },
      { branch: 'Sudirman', day: 'Sab', intensity: 0.4, value: 2500000 }, // Office area, low on weekend
      { branch: 'Sudirman', day: 'Min', intensity: 0.3, value: 2000000 },
    ],
    // Kemang
    [
      { branch: 'Kemang', day: 'Sen', intensity: 0.3, value: 2100000 },
      { branch: 'Kemang', day: 'Sel', intensity: 0.4, value: 2500000 },
      { branch: 'Kemang', day: 'Rab', intensity: 0.5, value: 2800000 },
      { branch: 'Kemang', day: 'Kam', intensity: 0.7, value: 3500000 },
      { branch: 'Kemang', day: 'Jum', intensity: 0.9, value: 4800000 },
      { branch: 'Kemang', day: 'Sab', intensity: 1.0, value: 6500000 }, // Hangout area
      { branch: 'Kemang', day: 'Min', intensity: 0.9, value: 5200000 },
    ],
    // Blok M
    [
      { branch: 'Blok M', day: 'Sen', intensity: 0.5, value: 2700000 },
      { branch: 'Blok M', day: 'Sel', intensity: 0.6, value: 3100000 },
      { branch: 'Blok M', day: 'Rab', intensity: 0.5, value: 2900000 },
      { branch: 'Blok M', day: 'Kam', intensity: 0.6, value: 3200000 },
      { branch: 'Blok M', day: 'Jum', intensity: 0.8, value: 4500000 },
      { branch: 'Blok M', day: 'Sab', intensity: 1.0, value: 5800000 },
      { branch: 'Blok M', day: 'Min', intensity: 0.8, value: 4600000 },
    ],
    // PIK
    [
      { branch: 'PIK', day: 'Sen', intensity: 0.2, value: 1500000 },
      { branch: 'PIK', day: 'Sel', intensity: 0.3, value: 1800000 },
      { branch: 'PIK', day: 'Rab', intensity: 0.3, value: 1900000 },
      { branch: 'PIK', day: 'Kam', intensity: 0.4, value: 2200000 },
      { branch: 'PIK', day: 'Jum', intensity: 0.7, value: 3800000 },
      { branch: 'PIK', day: 'Sab', intensity: 1.0, value: 6800000 },
      { branch: 'PIK', day: 'Min', intensity: 1.0, value: 6500000 },
    ],
    // Kelapa Gading
    [
      { branch: 'Kelapa Gading', day: 'Sen', intensity: 0.4, value: 2500000 },
      { branch: 'Kelapa Gading', day: 'Sel', intensity: 0.5, value: 2800000 },
      { branch: 'Kelapa Gading', day: 'Rab', intensity: 0.4, value: 2600000 },
      { branch: 'Kelapa Gading', day: 'Kam', intensity: 0.5, value: 2900000 },
      { branch: 'Kelapa Gading', day: 'Jum', intensity: 0.6, value: 3500000 },
      { branch: 'Kelapa Gading', day: 'Sab', intensity: 0.9, value: 5100000 },
      { branch: 'Kelapa Gading', day: 'Min', intensity: 0.8, value: 4800000 },
    ],
  ];

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
