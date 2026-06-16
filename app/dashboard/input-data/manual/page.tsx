'use client';

import ManualInputForm from '@/components/receipt/ManualInputForm';

export default function ManualInputPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Input Manual Transaksi</h1>
        <p className="text-sm text-text-secondary mt-1">Masukkan data struk secara manual jika tidak memiliki foto.</p>
      </div>

      <div className="bg-bg-card rounded-lg shadow-sm border border-border p-6">
        <ManualInputForm />
      </div>
    </div>
  );
}
