'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import ExtractionResult from './ExtractionResult';
import { toast } from 'sonner';

export default function VoiceUploader() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    setError(null);
    setExtractionResult(null);
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Mic access error:', err);
      const errorName = err?.name || '';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        toast.error("Microphone/Camera access blocked. Please allow permissions in your browser settings (click the lock icon in the URL bar) to use this feature.");
        setError('Akses mikrofon diblokir. Harap izinkan akses mikrofon di pengaturan browser Anda.');
      } else {
        setError('Gagal mengakses mikrofon. Pastikan mikrofon terhubung dan coba lagi.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/scanner/voice', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Gagal memproses suara');
      }

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setExtractionResult(json.data);
      } else {
        throw new Error('Format data tidak dikenali');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // If extraction is complete, show the result screen
  if (extractionResult) {
    return (
      <ExtractionResult
        initialData={extractionResult}
        onCancel={() => setExtractionResult(null)}
        source="Pesan Suara"
      />
    );
  }

  return (
    <div className="bg-bg-card rounded-lg shadow-sm border border-border p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
      <div className="max-w-md mx-auto space-y-8 w-full">
        
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">Input Data via Suara</h2>
          <p className="text-sm text-text-secondary">
            Ceritakan pengeluaran Anda. Contoh: <br />
            <span className="italic text-ink">"Siang ini saya makan di Solaria Grand Indonesia, abis 120 ribu pake uang pribadi."</span>
          </p>
        </div>

        {/* Microphone Area */}
        <div className="relative flex items-center justify-center py-8">
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute w-40 h-40 bg-primary/10 rounded-full animate-pulse" />
            </div>
          )}
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isProcessing ? 'bg-surface-soft cursor-not-allowed' :
              isRecording ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-primary hover:bg-primary-hover hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-text-tertiary animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8 text-white fill-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="h-10">
          {isProcessing ? (
            <div className="flex items-center justify-center text-primary font-medium">
              <Volume2 className="w-5 h-5 mr-2 animate-pulse" />
              Memproses Suara... (0.5s)
            </div>
          ) : isRecording ? (
            <div className="text-red-500 font-bold text-xl animate-pulse">
              {formatTime(recordingTime)}
            </div>
          ) : (
            <div className="text-text-secondary">
              Tekan mic untuk mulai berbicara
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-left border border-red-100">
            <strong>Gagal:</strong> {error}
          </div>
        )}

      </div>
    </div>
  );
}
