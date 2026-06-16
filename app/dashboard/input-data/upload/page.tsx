'use client';

import FileUploader from '@/components/receipt/FileUploader';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Struk</h1>
        <p className="text-sm text-text-secondary mt-1">Unggah file struk (gambar atau PDF) dari komputer Anda.</p>
      </div>
      
      <FileUploader />
    </div>
  );
}
