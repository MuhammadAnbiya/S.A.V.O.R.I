'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FilterSidebar({ onApply, onReset }: { onApply: (f: any) => void, onReset: () => void }) {
  return (
    <Card className="p-4 bg-white border-border shadow-sm h-full rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-text-primary">Filter Data</h3>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-text-secondary hover:text-primary">
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Rentang Waktu</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" className="text-xs" />
            <Input type="date" className="text-xs" />
          </div>
        </div>

        {/* Vendor */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Vendor</Label>
          <Input placeholder="Cari vendor..." className="text-sm" />
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Kategori</Label>
          <div className="space-y-2 mt-2">
            {['Operasional', 'Peralatan', 'Bahan Baku', 'Transportasi'].map(cat => (
              <div key={cat} className="flex items-center space-x-2">
                <input type="checkbox" id={`cat-${cat}`} className="rounded border-gray-300" />
                <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">{cat}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Cabang */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Cabang</Label>
          <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Semua Cabang</option>
            <option value="pusat">Kantor Pusat</option>
            <option value="cabang1">Cabang Jakarta</option>
          </select>
        </div>

        {/* Sumber */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Sumber Input</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            <label className="flex items-center space-x-2 text-sm bg-main px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 transition-colors">
              <input type="checkbox" className="rounded" /> <span>Kamera</span>
            </label>
            <label className="flex items-center space-x-2 text-sm bg-main px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 transition-colors">
              <input type="checkbox" className="rounded" /> <span>Upload</span>
            </label>
            <label className="flex items-center space-x-2 text-sm bg-main px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 transition-colors">
              <input type="checkbox" className="rounded" /> <span>Manual</span>
            </label>
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary-hover text-white mt-4" onClick={() => onApply({})}>
          Terapkan Filter
        </Button>
      </div>
    </Card>
  );
}
