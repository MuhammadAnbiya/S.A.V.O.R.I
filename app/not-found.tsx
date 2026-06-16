import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-main text-text-primary px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <FileQuestion className="w-24 h-24 text-primary opacity-20 mb-6" />
        <h1 className="text-6xl font-black text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-text-secondary mb-8">
          Sepertinya URL yang Anda kunjungi salah ketik atau halaman telah dipindahkan ke lokasi lain.
        </p>
        <Link href="/dashboard/overview" passHref>
          <Button className="bg-primary hover:bg-primary-hover text-white h-12 px-8 rounded-full shadow-lg">
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
