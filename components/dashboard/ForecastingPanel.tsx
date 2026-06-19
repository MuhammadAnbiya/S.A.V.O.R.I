'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useCSVData } from '@/lib/csv-context';

export default function ForecastingPanel() {
  const { data: csvData } = useCSVData();
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    if (!csvData || csvData.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
          branch_id: 'RM Takana Juo Kubang Cibolang',
          data_points: 30
      };

      const res = await fetch('/api/forecasting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!res.ok) {
          throw new Error('Service Unavailable');
      }

      const json = await res.json();
      
      if (json.data && json.data.forecast) {
          setForecastData(json.data.forecast);
      } else {
          throw new Error('Invalid format');
      }
    } catch (err) {
      console.error("Forecasting Error:", err);
      setError("Sistem prediksi AI (Python Service) sedang tidak aktif atau tidak dapat dijangkau.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (val: number) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}K`;
    return `Rp ${val}`;
  };

  const hasCSVData = csvData.length > 0;

  return (
    <Card className="p-6 border border-border shadow-sm bg-white h-[500px] flex flex-col relative overflow-hidden">
      {/* Decorative gradient blur in background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent opacity-5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-accent/10 text-accent rounded-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-text-primary">AI Predictive Forecasting</h3>
          <p className="text-sm text-text-secondary">Proyeksi pendapatan masa depan menggunakan Machine Learning</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm font-medium text-text-secondary">Menjalankan model prediksi AI...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-border rounded-xl bg-main/50">
            <AlertCircle className="w-10 h-10 text-text-secondary mb-3 opacity-50" />
            <p className="text-sm font-medium text-text-primary mb-1">Service Prediksi Tidak Tersedia</p>
            <p className="text-xs text-text-secondary max-w-[250px]">
              {error} Pastikan server FastAPI (`predict.py`) berjalan di background.
            </p>
          </div>
        ) : forecastData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={formatRp}
                dx={-10}
              />
              <Tooltip 
                formatter={(value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              {/* If historical is included, render it solid. If forecast, render dashed. */}
              <Line 
                type="monotone" 
                dataKey="predicted_revenue" 
                name="Prediksi (Forecast)" 
                stroke="#5db8a6" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#5db8a6', strokeWidth: 0 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : !hasCSVData ? (
           <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border rounded-xl bg-main/30">
             <TrendingUp className="w-8 h-8 text-text-secondary/30 mb-3" />
             <p className="text-sm text-text-secondary/60 font-medium">AI Predictive Forecasting</p>
             <p className="text-xs text-text-secondary/40 mt-1">Unggah file CSV untuk mengaktifkan prediksi</p>
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-border rounded-xl bg-main/50">
             <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
               <TrendingUp className="w-8 h-8 text-accent" />
             </div>
             <p className="text-sm font-medium text-text-primary mb-2 max-w-[300px]">
               Siap memproyeksikan pendapatan masa depan?
             </p>
             <p className="text-xs text-text-secondary mb-6 max-w-[350px]">
               Tekan tombol di bawah untuk menjalankan model Machine Learning berbasis XGBoost menggunakan data historis yang baru saja Anda unggah.
             </p>
             <button
                onClick={fetchForecast}
                className="px-6 py-2 bg-accent text-white rounded-full font-medium text-sm hover:bg-accent/90 transition-colors shadow-sm flex items-center gap-2"
             >
                <TrendingUp className="w-4 h-4" />
                Mulai Prediksi AI
             </button>
           </div>
        )}
      </div>
    </Card>
  );
}
