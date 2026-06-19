'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { UploadCloud, File, X, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExtractionResult from './ExtractionResult';
import { toast } from 'sonner';

export default function FileUploader() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, url: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<{id: string, data: any}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles = files.filter(f => validTypes.includes(f.type));
    
    if (validFiles.length === 0) {
      toast.error('Tidak ada format file yang didukung! Hanya JPG, PNG, WEBP.');
      return;
    }
    
    if (validFiles.length < files.length) {
      toast.warning(`Beberapa file diabaikan karena format tidak didukung.`);
    }

    const newSelected = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    
    setSelectedFiles(prev => [...prev, ...newSelected]);
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const resetAll = () => {
    setSelectedFiles([]);
    setExtractionResults([]);
    setError(null);
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    const results = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      setProcessingIndex(i);
      const { file } = selectedFiles[i];
      
      try {
        let imageBase64 = "";
        let finalMimeType = file.type;
        
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_DIMENSION = 800; 
            
            if (width > height && width > MAX_DIMENSION) {
              height = Math.round(height * (MAX_DIMENSION / width));
              width = MAX_DIMENSION;
            } else if (height > MAX_DIMENSION) {
              width = Math.round(width * (MAX_DIMENSION / height));
              height = MAX_DIMENSION;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to initialize canvas'));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            finalMimeType = 'image/jpeg';
            resolve(dataUrl.split(',')[1]);
          };
          img.onerror = () => reject(new Error('Gagal memuat gambar untuk kompresi'));
          img.src = URL.createObjectURL(file);
        });

        const { extractReceiptWithOCR } = await import('@/lib/receipt-ocr');
        const result = await extractReceiptWithOCR(imageBase64, finalMimeType);

        if (result) {
          results.push({ id: `file-${Date.now()}-${i}`, data: result });
        }
      } catch (err: any) {
        console.error(`Error pada file ${i+1}:`, err);
      }
    }
    
    if (results.length === 0) {
      setError("Semua file gagal diproses. Pastikan kualitas foto struk baik.");
      setIsProcessing(false);
      setProcessingIndex(-1);
      return;
    }

    setExtractionResults(results);
    setSelectedFiles([]); // clear queue
    setIsProcessing(false);
    setProcessingIndex(-1);
    toast.success(`${results.length} struk berhasil diekstrak!`);
  };

  const handleItemDone = (idToRemove: string) => {
    setExtractionResults(prev => {
      const remaining = prev.filter(item => item.id !== idToRemove);
      if (remaining.length === 0) {
        router.push('/dashboard/database');
      }
      return remaining;
    });
  };

  if (extractionResults.length > 0) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-br from-[#faf9f5] to-[#f4f0e6] border border-[#e6dfd8] rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-[#141413] font-display">
              Verifikasi {extractionResults.length} Struk Tersisa
            </h2>
            <p className="text-sm text-[#8e8b82] mt-1 font-sans">
              AI telah mengekstrak data. Silakan cek kembali dan klik "Konfirmasi & Simpan" pada setiap struk.
            </p>
          </div>
          <Button variant="outline" onClick={resetAll} className="text-[#c64545] border-[#e6dfd8] hover:bg-[#c64545]/10 shrink-0">
            Batalkan Semua
          </Button>
        </div>

        <div className="space-y-6">
          {extractionResults.map((res, index) => (
            <div key={res.id} className="relative pl-0 md:pl-6">
              <div className="hidden md:flex absolute left-0 top-6 w-8 h-8 bg-[#cc785c] text-white rounded-full items-center justify-center font-bold text-sm shadow-md ring-4 ring-white z-10">
                {index + 1}
              </div>
              <ExtractionResult 
                initialData={res.data} 
                onCancel={() => handleItemDone(res.id)} 
                onSuccess={() => handleItemDone(res.id)} 
                source="Upload" 
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-[#faf9f5] rounded-xl border border-[#e6dfd8] shadow-sm p-6 sm:p-8">
      {error && (
        <div className="w-full bg-[#c64545]/10 border border-[#c64545]/20 text-[#c64545] p-4 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {selectedFiles.length === 0 ? (
        <div 
          className={`border-2 border-dashed rounded-xl p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 ${dragActive ? 'border-[#cc785c] bg-[#cc785c]/5 scale-[0.99]' : 'border-[#e6dfd8] hover:border-[#cc785c]/50 hover:bg-black/5'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
          />
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
            <UploadCloud className="h-8 w-8 text-[#cc785c]" />
          </div>
          <h3 className="text-xl font-bold text-[#141413] mb-2 font-display">Upload Banyak Struk</h3>
          <p className="text-sm text-[#8e8b82] max-w-sm mx-auto">
            Tarik & lepas kumpulan gambar struk ke area ini, atau klik untuk memilih file dari perangkat Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#141413]">{selectedFiles.length} File Siap Diproses</h3>
              <p className="text-sm text-[#8e8b82]">Pastikan gambar jelas agar AI dapat membaca dengan baik.</p>
            </div>
            {!isProcessing && (
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="text-[#cc785c] border-[#e6dfd8] hover:bg-[#cc785c]/5">
                <PlusIcon className="w-4 h-4 mr-2" /> Tambah File
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {selectedFiles.map((item, idx) => {
              const isCurrent = idx === processingIndex;
              const isDone = processingIndex > idx && processingIndex !== -1;
              
              return (
                <div key={idx} className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-[#e6dfd8] bg-[#ebe4d8] shadow-sm">
                  <img src={item.url} alt={`Struk ${idx+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  
                  {/* Overlays */}
                  {isProcessing && isCurrent && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white animate-in fade-in">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                      <span className="text-xs font-medium">Mengekstrak...</span>
                    </div>
                  )}
                  {isProcessing && isDone && (
                    <div className="absolute inset-0 bg-[#2b8a3e]/30 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in zoom-in">
                      <div className="bg-white rounded-full p-1 shadow-md text-[#2b8a3e]">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  {isProcessing && !isCurrent && !isDone && (
                    <div className="absolute inset-0 bg-black/20" />
                  )}
                  
                  {/* Delete button */}
                  {!isProcessing && (
                    <button 
                      onClick={() => removeFile(idx)} 
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-[#c64545] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c64545] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#e6dfd8]">
            <Button 
              onClick={processFiles} 
              disabled={isProcessing} 
              className="w-full bg-[#cc785c] hover:bg-[#b86a50] text-white h-12 text-lg font-bold flex items-center justify-center gap-2 shadow-sm rounded-lg"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Memproses {processingIndex + 1} dari {selectedFiles.length} Struk...
                </>
              ) : (
                `Mulai Ekstrak ${selectedFiles.length} Struk`
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
