'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, VideoOff, Check, X } from 'lucide-react';
import ExtractionResult from './ExtractionResult';
import { toast } from 'sonner';
import LoadingTextRotator from './LoadingTextRotator';
import { useRouter } from 'next/navigation';

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'processing';

export default function CameraScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [extractionResults, setExtractionResults] = useState<any[]>([]);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Stop and release camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Request camera permission
  const startCamera = async () => {
    setErrorMessage(null);
    setCameraState('requesting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      setErrorMessage('Browser Anda tidak mendukung akses kamera. Coba gunakan Chrome atau Firefox terbaru.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraState('active');
    } catch (err: any) {
      const errorName: string = err?.name || '';

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        toast.error("Akses Kamera diblokir. Silakan izinkan di pengaturan browser Anda.");
        setCameraState('denied');
        setErrorMessage('Izin kamera ditolak. Izinkan kamera melalui pengaturan browser Anda, lalu coba lagi.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setCameraState('unavailable');
        setErrorMessage('Tidak ditemukan kamera yang tersedia di perangkat ini.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setCameraState('unavailable');
        setErrorMessage('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.');
      } else if (errorName === 'OverconstrainedError') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = fallbackStream;
          if (videoRef.current) videoRef.current.srcObject = fallbackStream;
          setCameraState('active');
        } catch {
          setCameraState('unavailable');
          setErrorMessage('Kamera tidak mendukung konfigurasi yang diminta. Coba refresh halaman.');
        }
      } else {
        setCameraState('denied');
        setErrorMessage(`Gagal mengakses kamera: ${err?.message || 'Unknown error'}. Coba gunakan opsi Upload File.`);
      }
    }
  };

  // Capture frame
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'active') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to JPEG base64 and add to queue
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    
    setCapturedImages(prev => [...prev, imageBase64]);
    toast.success("Foto ditambahkan ke antrean!");
  };

  const removeCapturedImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Process all captured images
  const processImages = async () => {
    if (capturedImages.length === 0) return;
    
    stopCamera();
    setCameraState('processing');
    setErrorMessage(null);
    
    const results = [];
    
    for (let i = 0; i < capturedImages.length; i++) {
      setProcessingIndex(i + 1);
      const base64 = capturedImages[i];
      
      try {
        const { extractReceiptWithOCR } = await import('@/lib/receipt-ocr');
        const result = await extractReceiptWithOCR(base64, 'image/jpeg');

        if (!result || (result.vendor_name.confidence === 0 && result.total_amount.confidence === 0)) {
          console.warn(`Foto ${i+1} gagal dibaca dengan baik.`);
        }

        results.push(result);
      } catch (err: any) {
        console.error(`Error pada foto ${i+1}:`, err);
        results.push(null);
      }
    }
    
    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) {
      setErrorMessage("Semua foto gagal diproses. Coba foto ulang dengan pencahayaan dan fokus yang lebih baik.");
      setCameraState('idle');
      return;
    }

    setExtractionResults(validResults);
    setCapturedImages([]); // clear images
  };

  const resetAll = () => {
    setExtractionResults([]);
    setCapturedImages([]);
    setCameraState('idle');
    setErrorMessage(null);
    setCompletedCount(0);
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

  // ── Extraction result view (Queue-based)
  if (extractionResults.length > 0) {
    const currentResult = extractionResults[0];
    const totalFilesCount = completedCount + extractionResults.length;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div>
            <h2 className="text-xl font-bold text-primary">Verifikasi Batch</h2>
            <p className="text-sm text-text-secondary mt-1">Struk ke-{completedCount + 1} dari {totalFilesCount}</p>
          </div>
          <button
            onClick={resetAll}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '36px', padding: '0 0.875rem', borderRadius: '0.5rem', border: '1px solid #e6dfd8', backgroundColor: '#faf9f5', color: '#c64545', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
          >
            Batalkan Semua
          </button>
        </div>
        <ExtractionResult 
          initialData={currentResult} 
          onCancel={handleCurrentSuccessOrSkip} 
          onSuccess={handleCurrentSuccessOrSkip} 
          source="Kamera" 
        />
      </div>
    );
  }

  // ── Camera UI
  return (
    <div
      style={{ backgroundColor: '#efe9de', borderRadius: '0.75rem', border: '1px solid #e6dfd8', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
    >
      {/* Error banner */}
      {errorMessage && (
        <div
          style={{ width: '100%', maxWidth: '480px', backgroundColor: 'rgba(198,69,69,0.08)', border: '1px solid rgba(198,69,69,0.2)', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}
        >
          <ShieldAlert style={{ width: 18, height: 18, color: '#c64545', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.875rem', color: '#c64545', lineHeight: 1.5, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Camera viewport */}
      <div
        style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '3/4', backgroundColor: '#181715', borderRadius: '0.75rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: cameraState === 'active' ? 'block' : 'none' }}
        />

        {cameraState === 'active' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '65%', height: '85%', border: '2px solid rgba(204,120,92,0.8)', borderRadius: '0.5rem', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
          </div>
        )}

        {(cameraState === 'idle' || cameraState === 'denied') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
            <VideoOff style={{ width: 40, height: 40, color: '#a09d96' }} />
            <p style={{ color: '#a09d96', fontSize: '0.875rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              Kamera belum aktif
            </p>
          </div>
        )}

        {cameraState === 'requesting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
            <RefreshCw style={{ width: 36, height: 36, color: '#cc785c', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#a09d96', fontSize: '0.875rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              Meminta izin kamera...
            </p>
          </div>
        )}

        {cameraState === 'processing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,23,21,0.9)', gap: '1rem' }}>
            <RefreshCw style={{ width: 36, height: 36, color: '#cc785c', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#faf9f5', fontSize: '0.9375rem', fontWeight: 500, fontFamily: 'var(--font-sans, Inter, sans-serif)', textAlign: 'center', padding: '0 1rem' }}>
              <LoadingTextRotator 
                texts={[
                  `Memproses foto ${processingIndex} dari ${capturedImages.length}...`,
                  "Analyzing layout with Qwen VL...",
                  "Parsing itemized line details...",
                  "Categorizing financial data..."
                ]} 
              />
            </p>
            <p style={{ color: '#a09d96', fontSize: '0.8125rem', textAlign: 'center', maxWidth: 260, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              AI sedang mengenali vendor, item, dan total transaksi
            </p>
          </div>
        )}

        {cameraState === 'unavailable' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
            <AlertCircle style={{ width: 36, height: 36, color: '#c64545' }} />
            <p style={{ color: '#a09d96', fontSize: '0.875rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              Kamera tidak tersedia
            </p>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      {/* Captured thumbnails */}
      {capturedImages.length > 0 && cameraState !== 'processing' && (
        <div className="w-full max-w-md flex flex-col gap-2">
          <p className="text-sm font-semibold text-text-secondary">{capturedImages.length} Foto Tersimpan</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {capturedImages.map((base64, idx) => (
              <div key={idx} className="relative flex-shrink-0 w-16 h-20 rounded overflow-hidden border-2 border-primary/20 bg-black">
                <img src={`data:image/jpeg;base64,${base64}`} className="w-full h-full object-cover" alt={`Captured ${idx}`} />
                <button 
                  onClick={() => removeCapturedImage(idx)}
                  className="absolute top-0.5 right-0.5 bg-danger text-white rounded-full p-0.5 hover:bg-danger-hover"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '480px', flexWrap: 'wrap' }}>
        {/* Start / Retry camera */}
        {cameraState !== 'active' && cameraState !== 'processing' && (
          <button
            onClick={startCamera}
            disabled={cameraState === 'requesting' || cameraState === 'unavailable'}
            style={{
              flex: 1,
              minWidth: '160px',
              height: '44px',
              backgroundColor: (cameraState === 'requesting' || cameraState === 'unavailable') ? '#e6dfd8' : '#cc785c',
              color: (cameraState === 'requesting' || cameraState === 'unavailable') ? '#6c6a64' : '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: (cameraState === 'requesting' || cameraState === 'unavailable') ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 150ms ease',
            }}
          >
            <Camera style={{ width: 18, height: 18 }} />
            {cameraState === 'requesting' ? 'Meminta Izin...' : cameraState === 'denied' ? 'Coba Lagi' : 'Aktifkan Kamera'}
          </button>
        )}

        {/* Capture button */}
        {cameraState === 'active' && (
          <button
            onClick={handleCapture}
            style={{
              flex: 1,
              minWidth: '160px',
              height: '44px',
              backgroundColor: '#e6dfd8',
              color: '#3d3d3a',
              borderRadius: '0.5rem',
              border: '1px solid #d5cece',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Camera style={{ width: 18, height: 18 }} />
            Ambil Foto
          </button>
        )}
        
        {/* Process button (only when there are captured images) */}
        {capturedImages.length > 0 && cameraState !== 'processing' && (
          <button
            onClick={processImages}
            style={{
              flex: 1,
              minWidth: '160px',
              height: '44px',
              backgroundColor: '#cc785c',
              color: '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Check style={{ width: 18, height: 18 }} />
            Proses {capturedImages.length} Struk
          </button>
        )}
      </div>

      {/* Hint text */}
      {cameraState === 'idle' && (
        <p style={{ fontSize: '0.8125rem', color: '#8e8b82', textAlign: 'center', maxWidth: '360px', fontFamily: 'var(--font-sans, Inter, sans-serif)', lineHeight: 1.5 }}>
          Browser akan meminta izin kamera saat Anda menekan tombol. Pastikan untuk mengklik <strong>Izinkan</strong> pada dialog yang muncul.
        </p>
      )}

      {cameraState === 'denied' && (
        <p style={{ fontSize: '0.8125rem', color: '#8e8b82', textAlign: 'center', maxWidth: '360px', fontFamily: 'var(--font-sans, Inter, sans-serif)', lineHeight: 1.5 }}>
          💡 Tip: Klik ikon kunci 🔒 di address bar browser, lalu set izin Kamera ke <strong>Izinkan</strong>.
        </p>
      )}
    </div>
  );
}
