'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCSVData } from '@/lib/csv-context';
import { parsePOSDate } from '@/lib/csv-parser';

export default function HeatmapPerforma() {
  const { data } = useCSVData();

  const heatmapData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const timeBlocks = ['06-10', '10-14', '14-18', '18-22', '22-02'];
    
    // Initialize matrix
    const matrix = days.map(() => timeBlocks.map(() => 0));

    if (!data || data.length === 0) {
      // Demo data
      const mockValues = [
        [5, 12, 18, 25, 8],
        [4, 15, 20, 22, 5],
        [6, 18, 25, 30, 10],
        [8, 20, 22, 35, 15],
        [10, 25, 30, 45, 25],
        [15, 35, 45, 60, 40],
        [12, 30, 40, 50, 30],
      ];
      return { matrix: mockValues, max: 60 };
    }

    let maxVal = 0;

    data.forEach(row => {
      if (row.totalPenjualan <= 0) return;
      if (!row.tanggalPenjualan || !row.waktuPenjualan) return;

      const dateObj = parsePOSDate(row.tanggalPenjualan);
      if (dateObj) {
        let dayIdx = dateObj.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday

        const hour = parseInt(row.waktuPenjualan.split(':')[0], 10);
        let timeIdx = 0;
        if (hour >= 6 && hour < 10) timeIdx = 0;
        else if (hour >= 10 && hour < 14) timeIdx = 1;
        else if (hour >= 14 && hour < 18) timeIdx = 2;
        else if (hour >= 18 && hour < 22) timeIdx = 3;
        else timeIdx = 4;

        matrix[dayIdx][timeIdx]++;
        if (matrix[dayIdx][timeIdx] > maxVal) maxVal = matrix[dayIdx][timeIdx];
      }
    });

    return { matrix, max: maxVal > 0 ? maxVal : 1 };
  }, [data]);

  const hasData = data.length > 0;
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const timeBlocks = ['06:00 - 10:00', '10:00 - 14:00', '14:00 - 18:00', '18:00 - 22:00', '22:00 - 02:00'];

  // Function to get color based on intensity
  const getColor = (val: number, max: number) => {
    if (val === 0) return 'bg-main';
    const intensity = val / max;
    if (intensity < 0.2) return 'bg-[#e2c1b5]'; // very light coral
    if (intensity < 0.4) return 'bg-[#d8a694]';
    if (intensity < 0.6) return 'bg-[#ce8b74]';
    if (intensity < 0.8) return 'bg-[#cc785c]'; // primary coral
    return 'bg-[#ba6548]'; // dark coral
  };

  return (
    <Card className={`p-6 border shadow-sm h-[400px] flex flex-col bg-white transition-opacity relative ${hasData ? 'border-border opacity-100' : 'border-border/50 opacity-80'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Heatmap Kepadatan</h3>
          <p className="text-sm text-text-secondary">Konsentrasi transaksi per blok waktu</p>
        </div>
      </div>

      {!hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
            <p className="text-xs font-semibold text-text-secondary">Demo Data</p>
          </div>
        </div>
      )}

      <div className={`flex-1 w-full flex flex-col ${!hasData ? 'grayscale opacity-40' : ''}`}>
        <div className="flex mb-2">
          <div className="w-12 flex-shrink-0"></div>
          {timeBlocks.map((tb, i) => (
            <div key={i} className="flex-1 text-center text-[10px] text-text-secondary font-medium">
              {tb.split(' - ')[0]}<br/>-<br/>{tb.split(' - ')[1]}
            </div>
          ))}
        </div>
        
        <div className="flex-1 flex flex-col gap-1.5">
          {days.map((day, dIdx) => (
            <div key={day} className="flex flex-1 items-stretch gap-1.5">
              <div className="w-12 flex items-center justify-end pr-2 text-xs font-medium text-text-secondary">
                {day}
              </div>
              {heatmapData.matrix[dIdx].map((val, tIdx) => (
                <div 
                  key={`${dIdx}-${tIdx}`} 
                  className={`flex-1 rounded-md flex items-center justify-center transition-colors ${getColor(val, heatmapData.max)}`}
                  title={`${val} transaksi`}
                >
                  <span className={`text-[10px] font-bold ${val > (heatmapData.max * 0.5) ? 'text-white' : 'text-text-primary'}`}>
                    {hasData ? val : 0}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-text-secondary">
          <span>Sepi</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-main"></div>
            <div className="w-3 h-3 rounded-sm bg-[#e2c1b5]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#d8a694]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#ce8b74]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#cc785c]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#ba6548]"></div>
          </div>
          <span>Ramai</span>
        </div>
      </div>
    </Card>
  );
}
