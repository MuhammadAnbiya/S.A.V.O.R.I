'use client';

import CameraScanner from '@/components/receipt/CameraScanner';

export default function CameraScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Struk Kamera</h1>
        <p className="text-sm text-text-secondary mt-1">Gunakan kamera Anda untuk memindai struk secara langsung.</p>
      </div>
      
      <CameraScanner />
    </div>
  );
}
