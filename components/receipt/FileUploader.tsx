'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { UploadCloud, File, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExtractionResult from './ExtractionResult';
import { toast } from 'sonner';
import LoadingTextRotator from './LoadingTextRotator';

export default function FileUploader() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, url: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<any[]>([]);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
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
    setTotalFilesCount(0);
    setCompletedCount(0);
    setError(null);
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setTotalFilesCount(selectedFiles.length);
    
    const results = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      setProcessingIndex(i + 1);
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

        if (!result || (result.vendor_name.confidence === 0 && result.total_amount.confidence === 0)) {
          console.warn(`Struk ${i+1} gagal dibaca dengan baik.`);
        }
        
        results.push(result);
      } catch (err: any) {
        console.error(`Error pada file ${i+1}:`, err);
        // Tetap push empty result agar queue jalan terus
        results.push(null);
      }
    }
    
    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) {
      setError("Semua file gagal diproses. Pastikan kualitas foto struk baik.");
      setIsProcessing(false);
      return;
    }

    setExtractionResults(validResults);
    setSelectedFiles([]); // clear queue
    setIsProcessing(false);
  };

  const handleCurrentSuccessOrSkip = () => {
    if (extractionResults.length <= 1) {
      toast.success("Semua struk berhasil diproses!");
      router.push('/dashboard/database');
    } else {
      setExtractionResults(prev => prev.slice(1));
      setCompletedCount(c => c + 1);
    }
  };

  if (extractionResults.length > 0) {
    const currentResult = extractionResults[0];
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div>
            <h2 className="text-xl font-bold text-primary">Verifikasi Batch</h2>
            <p className="text-sm text-text-secondary mt-1">Struk ke-{completedCount + 1} dari {totalFilesCount}</p>
          </div>
          <Button variant="outline" onClick={resetAll} className="text-danger hover:text-danger hover:bg-danger/10">
            Batalkan Semua
          </Button>
        </div>
        <ExtractionResult 
          initialData={currentResult} 
          onCancel={handleCurrentSuccessOrSkip} // treat cancel as skip for this item
          onSuccess={handleCurrentSuccessOrSkip} 
          source="Upload" 
        />
      </div>
    );
  }

  return (
    <Card className="bg-bg-card rounded-lg border border-border shadow-sm p-6">
      {error && (
        <div className="w-full bg-danger/10 text-danger p-3 rounded-md mb-6 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          {error}
        </div>
      )}

      {selectedFiles.length === 0 ? (
        <div 
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-surface-soft/25'}`}
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
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Klik atau Drag & Drop file ke sini</h3>
          <p className="text-sm text-muted-foreground">
            Bisa upload beberapa gambar sekaligus (JPG, PNG, WEBP).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{selectedFiles.length} File Terpilih</h3>
            {!isProcessing && (
              <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} className="text-primary">
                + Tambah File
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

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {selectedFiles.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-main">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded overflow-hidden border bg-white flex-shrink-0">
                    <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-ink truncate max-w-[200px] sm:max-w-xs">{item.file.name}</p>
                    <p className="text-xs font-medium text-text-secondary">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {!isProcessing && (
                  <Button variant="ghost" size="icon" onClick={() => removeFile(idx)} className="text-danger hover:text-danger hover:bg-danger/10">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={processFiles} 
            disabled={isProcessing} 
            className="w-full bg-primary hover:bg-primary-hover text-white h-12 text-lg font-semibold flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0" />
                <LoadingTextRotator 
                  texts={[
                    `Memproses struk ${processingIndex} dari ${selectedFiles.length}...`,
                    "Mengekstrak data via AI...",
                    "Membaca daftar item..."
                  ]} 
                />
              </>
            ) : (
              `Ekstrak ${selectedFiles.length} Struk Sekaligus`
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
