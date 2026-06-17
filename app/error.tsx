'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-main text-text-primary">
      <div className="flex flex-col items-center max-w-md text-center p-8 bg-white border border-border shadow-lg rounded-2xl">
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Terjadi Kesalahan Teknis</h2>
        <p className="text-text-secondary mb-8 text-sm">
          Maaf, ada sesuatu yang tidak berjalan dengan semestinya. Tim kami telah diberitahu.
        </p>
        <Button
          onClick={() => reset()}
          className="w-full bg-primary hover:bg-primary-hover text-white"
        >
          Coba Lagi Sekarang
        </Button>
      </div>
    </div>
  );
}
