'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, VideoOff } from 'lucide-react';
import ExtractionResult from './ExtractionResult';

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'processing';

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);

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

  // Request camera permission (triggered by user click, not auto)
  const startCamera = async () => {
    setErrorMessage(null);
    setCameraState('requesting');

    // Check if mediaDevices is available at all
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      setErrorMessage('Browser Anda tidak mendukung akses kamera. Coba gunakan Chrome atau Firefox terbaru.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
        // User explicitly denied OR dismissed the dialog
        setCameraState('denied');
        setErrorMessage('Izin kamera ditolak atau dibatalkan. Klik tombol di bawah untuk coba lagi, atau izinkan kamera melalui pengaturan browser Anda.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setCameraState('unavailable');
        setErrorMessage('Tidak ditemukan kamera yang tersedia di perangkat ini.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setCameraState('unavailable');
        setErrorMessage('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.');
      } else if (errorName === 'OverconstrainedError') {
        // Retry without constraints
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
        setErrorMessage(`Gagal mengakses kamera: ${err?.message || 'Unknown error'}. Coba lagi atau gunakan opsi Upload File.`);
      }
    }
  };

  // Capture frame and send to Gemini
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'active') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

    stopCamera();
    setCameraState('processing');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scanner/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64, mime_type: 'image/jpeg' }),
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.error?.message || 'Gagal mengekstrak data dari struk.');
      }

      setExtractionResult(result.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses gambar. Coba scan ulang.');
      setCameraState('idle');
    }
  };

  const handleRetake = () => {
    setExtractionResult(null);
    setCameraState('idle');
    setErrorMessage(null);
  };

  // ── Extraction result view
  if (extractionResult) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#cc785c', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              Hasil Scan
            </p>
            <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#141413' }}>
              Verifikasi Data Struk
            </h2>
          </div>
          <button
            onClick={handleRetake}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', height: '36px', padding: '0 0.875rem', borderRadius: '0.5rem', border: '1px solid #e6dfd8', backgroundColor: '#faf9f5', color: '#3d3d3a', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
          >
            <RefreshCw className="h-4 w-4" /> Scan Ulang
          </button>
        </div>
        <ExtractionResult initialData={extractionResult} />
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
        style={{ position: 'relative', width: '100%', maxWidth: '480px', aspectRatio: '4/3', backgroundColor: '#181715', borderRadius: '0.75rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Video feed — always rendered so ref is available */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: cameraState === 'active' ? 'block' : 'none' }}
        />

        {/* Capture guide overlay */}
        {cameraState === 'active' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '75%', height: '75%', border: '2px solid rgba(204,120,92,0.7)', borderRadius: '0.5rem', boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)' }} />
          </div>
        )}

        {/* Idle state */}
        {(cameraState === 'idle' || cameraState === 'denied') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
            <VideoOff style={{ width: 40, height: 40, color: '#a09d96' }} />
            <p style={{ color: '#a09d96', fontSize: '0.875rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              Kamera belum aktif
            </p>
          </div>
        )}

        {/* Requesting permission */}
        {cameraState === 'requesting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
            <RefreshCw style={{ width: 36, height: 36, color: '#cc785c', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#a09d96', fontSize: '0.875rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              Meminta izin kamera...
            </p>
          </div>
        )}

        {/* Processing */}
        {cameraState === 'processing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,23,21,0.9)', gap: '1rem' }}>
            <RefreshCw style={{ width: 36, height: 36, color: '#cc785c', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#faf9f5', fontSize: '0.9375rem', fontWeight: 500, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>Memproses Struk...</p>
            <p style={{ color: '#a09d96', fontSize: '0.8125rem', textAlign: 'center', maxWidth: 260, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
              AI sedang mengenali vendor, item, dan total transaksi
            </p>
          </div>
        )}

        {/* Unavailable */}
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '480px' }}>
        {/* Start / Retry camera */}
        {cameraState !== 'active' && cameraState !== 'processing' && (
          <button
            onClick={startCamera}
            disabled={cameraState === 'requesting' || cameraState === 'unavailable'}
            style={{
              flex: 1,
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
              height: '44px',
              backgroundColor: '#cc785c',
              color: '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
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
            Ambil Foto & Scan
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
