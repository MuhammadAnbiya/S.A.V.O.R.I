import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect pengguna langsung ke halaman dashboard
  // (Middleware akan secara otomatis menangani pengalihan ke /login jika user belum login)
  redirect('/dashboard/overview');
}
