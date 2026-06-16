'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Save } from "lucide-react";
import ManualInputForm from "../receipt/ManualInputForm";

export default function EditModal({ transaction, onClose, onSave }: any) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-text-primary">Edit Transaksi {transaction.id}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-main rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-main">
          {/* We reuse the ManualInputForm for editing, ideally passing initialData */}
          <ManualInputForm initialData={transaction} />
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={onSave} className="bg-primary hover:bg-primary-hover text-white">
            <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
          </Button>
        </div>
      </Card>
    </div>
  );
}
