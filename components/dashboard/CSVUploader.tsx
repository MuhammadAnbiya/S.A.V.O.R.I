'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { parseAndCleanCSV } from '@/lib/csv-parser';
import { useCSVData } from '@/lib/csv-context';
import { toast } from 'sonner';

export default function CSVUploader() {
  const { data, setData, fileName, setFileName, clearData } = useCSVData();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Format tidak didukung', {
        description: 'Hanya file .csv yang diperbolehkan.',
      });
      return;
    }

    setIsParsing(true);
    try {
      const parsedData = await parseAndCleanCSV(file);
      if (parsedData.length === 0) {
        toast.error('File kosong atau format salah', {
          description: 'Tidak dapat menemukan data transaksi di dalam file ini.',
        });
      } else {
        setData(parsedData);
        setFileName(file.name);
        toast.success('Upload berhasil', {
          description: `${parsedData.length} baris data berhasil dimuat.`,
        });
      }
    } catch (error) {
      toast.error('Gagal membaca file', {
        description: 'Terjadi kesalahan saat memparsing CSV.',
      });
    } finally {
      setIsParsing(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // If data is loaded, show a compact success state
  if (data.length > 0) {
    return (
      <div className="flex items-center justify-between bg-white border border-border p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 text-success rounded-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{fileName}</p>
            <p className="text-xs text-text-secondary">{data.length} transaksi dimuat</p>
          </div>
        </div>
        <button 
          onClick={clearData}
          className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
          title="Hapus data"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Otherwise show the uploader
  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/50 hover:bg-main'
      }`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv" 
        className="hidden" 
      />
      
      {isParsing ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm font-medium text-text-primary">Membaca data CSV...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-main rounded-full flex items-center justify-center mb-4 text-text-secondary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">Unggah Data Penjualan POS</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Tarik & lepas file .csv laporan kasir Anda ke area ini, atau klik untuk memilih file.
          </p>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-4 text-xs font-semibold text-[#cc785c] hover:text-[#b06349] transition-colors relative z-10"
          >
            <a 
              href="https://drive.google.com/drive/folders/1XsPgQbFz9hydW4x4lPiiNp9yNSBNe7cr?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#cc785c]/10 rounded-full hover:bg-[#cc785c]/20 transition-all duration-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Data Testing (CSV & Foto Struk)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
