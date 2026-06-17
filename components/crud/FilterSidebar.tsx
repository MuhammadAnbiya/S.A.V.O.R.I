'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FilterSidebar({ onApply, onReset, branches = [] }: { onApply: (f: any) => void, onReset: () => void, branches?: string[] }) {
  const [vendor, setVendor] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [branch, setBranch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sources, setSources] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSource = (src: string) => {
    setSources(prev => 
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  const handleApply = () => {
    onApply({
      vendor,
      category: categories,
      branch,
      startDate,
      endDate,
      sources
    });
  };

  const handleReset = () => {
    setVendor("");
    setCategories([]);
    setBranch("");
    setStartDate("");
    setEndDate("");
    setSources([]);
    onReset();
  };

  return (
    <Card className="p-4 bg-white border-border shadow-sm h-full rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-text-primary">Filter Data</h3>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-text-secondary hover:text-primary">
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Rentang Waktu</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" className="text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <Input type="date" className="text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Vendor */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Vendor</Label>
          <Input 
            placeholder="Cari vendor..." 
            className="text-sm" 
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Kategori</Label>
          <div className="space-y-2 mt-2">
            {['Operasional', 'Peralatan', 'Bahan Baku', 'Transportasi'].map(cat => (
              <div key={cat} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id={`cat-${cat}`} 
                  className="rounded border-gray-300" 
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">{cat}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Cabang */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Cabang</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="">Semua Cabang</option>
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Sumber */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Sumber Input</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Kamera', 'Upload', 'Manual'].map(src => (
              <label key={src} className="flex items-center space-x-2 text-sm bg-main px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={sources.includes(src)}
                  onChange={() => toggleSource(src)}
                /> 
                <span>{src}</span>
              </label>
            ))}
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary-hover text-white mt-4" onClick={handleApply}>
          Terapkan Filter
        </Button>
      </div>
    </Card>
  );
}
