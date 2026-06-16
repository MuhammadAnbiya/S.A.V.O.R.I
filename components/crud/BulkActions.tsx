'use client';

import { Button } from "@/components/ui/button";
import { Trash2, FolderPlus, X } from "lucide-react";

export default function BulkActions({ selectedCount, onClear, onDelete, onCategorize }: any) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-primary/20 px-6 py-3 flex items-center space-x-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center space-x-2">
        <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-text-primary">transaksi terpilih</span>
      </div>
      
      <div className="h-6 w-px bg-border mx-2"></div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onCategorize} className="text-primary border-primary hover:bg-primary hover:text-white">
          <FolderPlus className="w-4 h-4 mr-2" /> Kategorisasi
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-danger border-danger hover:bg-danger hover:text-white">
          <Trash2 className="w-4 h-4 mr-2" /> Hapus
        </Button>
      </div>

      <div className="h-6 w-px bg-border mx-2"></div>

      <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-text-secondary hover:text-text-primary rounded-full">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
