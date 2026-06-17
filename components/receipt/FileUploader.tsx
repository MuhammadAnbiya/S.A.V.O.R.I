'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { UploadCloud, File, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExtractionResult from './ExtractionResult';

export default function FileUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Format file tidak didukung. Harap upload gambar (JPG/PNG/WEBP) atau PDF.');
      return;
    }
    
    // In a real implementation with batch support, this would be an array.
    // For this implementation, we focus on 1 file for simplicity matching ExtractionResult.
    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // It's a PDF
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractionResult(null);
  };

  const processFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract just the base64 part
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(selectedFile);
      const imageBase64 = await base64Promise;

      const response = await fetch('/api/scanner/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          mime_type: selectedFile.type
        })
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.error?.message || 'Gagal mengekstrak data');
      }

      setExtractionResult(result.data);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses file.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (extractionResult) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Hasil Ekstraksi</h2>
          <Button variant="outline" onClick={removeFile}>
            <RefreshCw className="mr-2 h-4 w-4" /> Upload Lainnya
          </Button>
        </div>
        <ExtractionResult initialData={extractionResult} onCancel={removeFile} source="Upload" />
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

      {!selectedFile ? (
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
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleChange}
          />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Klik atau Drag & Drop file ke sini</h3>
          <p className="text-sm text-muted-foreground">
            Mendukung gambar (JPG, PNG, WEBP) dan dokumen PDF.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-main">
            <div className="flex items-center space-x-4">
              {previewUrl ? (
                <div className="w-16 h-16 rounded overflow-hidden border bg-white flex-shrink-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded border bg-white flex items-center justify-center flex-shrink-0">
                  <File className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {!isProcessing && (
              <Button variant="ghost" size="icon" onClick={removeFile} className="text-danger hover:text-danger hover:bg-danger/10">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Button 
            onClick={processFile} 
            disabled={isProcessing} 
            className="w-full bg-accent hover:opacity-90 text-white h-12 text-lg"
          >
            {isProcessing ? (
              <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Sedang Mengekstrak Data...</>
            ) : (
              'Ekstrak Data Struk'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
