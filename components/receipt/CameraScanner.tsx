'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, VideoOff, Check, X, CheckCircle2 } from 'lucide-react';
import ExtractionResult from './ExtractionResult';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'processing';

export default function CameraScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<{id: string, base64: string}[]>([]);
  const [extractionResults, setExtractionResults] = useState<{id: string, data: any}[]>([]);
  const [processingIndex, setProcessingIndex] = useState(-1);

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
    
    setCapturedImages(prev => [...prev, { id: `cap-${Date.now()}`, base64: imageBase64 }]);
    
    // Simple visual feedback flash on video
    video.style.opacity = '0.5';
    setTimeout(() => {
      video.style.opacity = '1';
    }, 100);
  };

  const removeCapturedImage = (idToRemove: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  // Process all captured images
  const processImages = async () => {
    if (capturedImages.length === 0) return;
    
    stopCamera();
    setCameraState('processing');
    setErrorMessage(null);
    
    const results = [];
    
    for (let i = 0; i < capturedImages.length; i++) {
      setProcessingIndex(i);
      const img = capturedImages[i];
      
      try {
        const { extractReceiptWithOCR } = await import('@/lib/receipt-ocr');
        const result = await extractReceiptWithOCR(img.base64, 'image/jpeg');

        if (result) {
          results.push({ id: img.id, data: result });
        }
      } catch (err: any) {
        console.error(`Error pada foto ${i+1}:`, err);
      }
    }
    
    if (results.length === 0) {
      setErrorMessage("Semua foto gagal diproses. Coba foto ulang dengan pencahayaan dan fokus yang lebih baik.");
      setCameraState('idle');
      setProcessingIndex(-1);
      return;
    }

    setExtractionResults(results);
    setCapturedImages([]); // clear images
    setProcessingIndex(-1);
    toast.success(`${results.length} struk berhasil diekstrak!`);
  };

  const resetAll = () => {
    setExtractionResults([]);
    setCapturedImages([]);
    setCameraState('idle');
    setErrorMessage(null);
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

  // ── Extraction result view (List of all extracted receipts)
  if (extractionResults.length > 0) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-br from-[#faf9f5] to-[#f4f0e6] border border-[#e6dfd8] rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-[#141413] font-display">
              Verifikasi {extractionResults.length} Struk Tersisa
            </h2>
            <p className="text-sm text-[#8e8b82] mt-1 font-sans">
              AI telah mengekstrak data dari foto Anda. Silakan cek kembali dan simpan.
            </p>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e6dfd8] bg-white text-[#c64545] text-sm font-medium hover:bg-[#c64545]/10 shrink-0 transition-colors"
          >
            Batalkan Semua
          </button>
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
                source="Kamera" 
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Camera UI
  return (
    <div className="bg-[#faf9f5] rounded-xl border border-[#e6dfd8] shadow-sm p-6 sm:p-8 flex flex-col items-center gap-6">
      
      <div className="w-full max-w-xl text-center mb-2">
        <h3 className="text-xl font-bold text-[#141413] mb-2 font-display">Scan Struk Beruntun</h3>
        <p className="text-sm text-[#8e8b82]">
          Ambil foto struk satu per satu. Setelah selesai, proses semuanya sekaligus.
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="w-full max-w-xl bg-[#c64545]/10 border border-[#c64545]/20 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#c64545] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#c64545] leading-relaxed">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
        {/* LEFT/TOP: Camera viewport */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-[400px] aspect-[3/4] bg-[#181715] rounded-xl overflow-hidden shadow-inner flex items-center justify-center mx-auto ring-1 ring-black/5">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150"
              style={{ display: cameraState === 'active' ? 'block' : 'none' }}
            />

            {cameraState === 'active' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                {/* Subtle corner markers instead of full border to avoid confusing users about the capture area */}
                <div className="w-full h-full relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <p className="text-white/50 text-xs font-medium tracking-widest uppercase">Posisikan struk dalam area ini</p>
                  </div>
                </div>
              </div>
            )}

            {(cameraState === 'idle' || cameraState === 'denied') && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <VideoOff className="w-10 h-10 text-[#a09d96]" />
                <p className="text-[#a09d96] text-sm">Kamera belum aktif</p>
              </div>
            )}

            {cameraState === 'requesting' && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <RefreshCw className="w-9 h-9 text-[#cc785c] animate-spin" />
                <p className="text-[#a09d96] text-sm">Meminta izin kamera...</p>
              </div>
            )}

            {cameraState === 'processing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#181715]/90 backdrop-blur-sm gap-4">
                <RefreshCw className="w-10 h-10 text-[#cc785c] animate-spin" />
                <p className="text-white font-medium text-center px-4 animate-pulse">
                  Mengekstrak {capturedImages.length} struk...
                </p>
              </div>
            )}

            {cameraState === 'unavailable' && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <AlertCircle className="w-9 h-9 text-[#c64545]" />
                <p className="text-[#a09d96] text-sm">Kamera tidak tersedia</p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action buttons under camera */}
          <div className="flex w-full max-w-[400px] gap-3">
            {cameraState !== 'active' && cameraState !== 'processing' && (
              <button
                onClick={startCamera}
                disabled={cameraState === 'requesting' || cameraState === 'unavailable'}
                className={`flex-1 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors
                  ${(cameraState === 'requesting' || cameraState === 'unavailable') 
                    ? 'bg-[#e6dfd8] text-[#8e8b82] cursor-not-allowed' 
                    : 'bg-[#cc785c] hover:bg-[#b86a50] text-white shadow-sm'}`}
              >
                <Camera className="w-5 h-5" />
                {cameraState === 'requesting' ? 'Meminta...' : cameraState === 'denied' ? 'Coba Lagi' : 'Aktifkan Kamera'}
              </button>
            )}

            {cameraState === 'active' && (
              <button
                onClick={handleCapture}
                className="flex-1 h-12 bg-white hover:bg-[#f4f0e6] border-2 border-[#cc785c] text-[#cc785c] rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Camera className="w-5 h-5" />
                Jepret Struk
              </button>
            )}
          </div>
        </div>

        {/* RIGHT/BOTTOM: Captured Gallery */}
        <div className="flex-1 w-full bg-white rounded-xl border border-[#e6dfd8] p-4 flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-[#141413]">Galeri Antrean</h4>
            <span className="text-xs font-bold bg-[#efe9de] text-[#cc785c] px-2 py-1 rounded-full">
              {capturedImages.length} Foto
            </span>
          </div>

          {capturedImages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#e6dfd8] rounded-lg bg-[#faf9f5]">
              <Camera className="w-8 h-8 text-[#d5cece] mb-2" />
              <p className="text-sm text-[#8e8b82]">Belum ada struk yang difoto. Mulai jepret struk untuk menambahkannya ke antrean di sini.</p>
            </div>
          ) : (
            <div className="flex-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                {capturedImages.map((img, idx) => {
                  const isCurrent = idx === processingIndex;
                  const isDone = processingIndex > idx && processingIndex !== -1;

                  return (
                    <div key={img.id} className="group relative aspect-[3/4] rounded-md overflow-hidden border border-[#e6dfd8] bg-black shadow-sm">
                      <img src={`data:image/jpeg;base64,${img.base64}`} className="w-full h-full object-cover" alt={`Captured ${idx}`} />
                      
                      {/* Overlays */}
                      {cameraState === 'processing' && isCurrent && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                      {cameraState === 'processing' && isDone && (
                        <div className="absolute inset-0 bg-[#2b8a3e]/40 flex items-center justify-center">
                          <div className="bg-white rounded-full p-0.5">
                            <CheckCircle2 className="w-4 h-4 text-[#2b8a3e]" />
                          </div>
                        </div>
                      )}
                      {cameraState === 'processing' && !isCurrent && !isDone && (
                        <div className="absolute inset-0 bg-black/20" />
                      )}

                      {/* Delete button */}
                      {cameraState !== 'processing' && (
                        <button 
                          onClick={() => removeCapturedImage(img.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-[#c64545] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c64545] hover:text-white shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Number badge */}
                      <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/60 text-white text-[10px] rounded flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 mt-auto border-t border-[#e6dfd8]">
            <button
              onClick={processImages}
              disabled={capturedImages.length === 0 || cameraState === 'processing'}
              className={`w-full h-12 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                ${(capturedImages.length === 0 || cameraState === 'processing') 
                  ? 'bg-[#e6dfd8] text-[#a09d96] cursor-not-allowed' 
                  : 'bg-[#cc785c] hover:bg-[#b86a50] text-white'}`}
            >
              {cameraState === 'processing' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Mengekstrak {processingIndex + 1} / {capturedImages.length}...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Proses {capturedImages.length} Struk Sekaligus
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
