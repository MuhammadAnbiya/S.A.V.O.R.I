'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import ExtractionResult from './ExtractionResult';

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Tidak dapat mengakses kamera. Pastikan browser memiliki izin.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: stop camera when unmounted
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get base64 image
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      stopCamera(); // Stop camera while processing
      
      await processImage(imageBase64);
    }
    
    setIsCapturing(false);
  };

  const processImage = async (imageBase64: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/scanner/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          mime_type: 'image/jpeg'
        })
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.error?.message || 'Gagal mengekstrak data');
      }

      setExtractionResult(result.data);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Terjadi kesalahan saat mengekstrak data dari struk.');
      // Restart camera so user can try again
      startCamera();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setExtractionResult(null);
    startCamera();
  };

  if (extractionResult) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Hasil Ekstraksi</h2>
          <Button variant="outline" onClick={handleRetake}>
            <RefreshCw className="mr-2 h-4 w-4" /> Scan Ulang
          </Button>
        </div>
        <ExtractionResult initialData={extractionResult} />
      </div>
    );
  }

  return (
    <Card className="bg-bg-card rounded-lg border border-border shadow-sm p-6 overflow-hidden flex flex-col items-center">
      {error && (
        <div className="w-full bg-danger/10 text-danger p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          {error}
        </div>
      )}

      <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {!isProcessing && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Invisible canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
            <RefreshCw className="h-10 w-10 animate-spin mb-4 text-accent" />
            <p className="font-medium">Memproses Struk dengan AI...</p>
            <p className="text-sm text-gray-400 mt-2 text-center px-4">
              Harap tunggu, sistem sedang mengenali vendor, item, dan total transaksi.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4 w-full max-w-md">
        <Button 
          className="w-full bg-accent hover:opacity-90 text-white h-12 text-lg" 
          onClick={handleCapture}
          disabled={!stream || isCapturing || isProcessing}
        >
          <Camera className="mr-2 h-5 w-5" /> 
          {isProcessing ? 'Memproses...' : 'Scan Struk'}
        </Button>
      </div>
    </Card>
  );
}
