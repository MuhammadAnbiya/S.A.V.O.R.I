'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInEmail } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await signInEmail(formData);
    setIsLoading(false);
    if (result && "error" in result) {
      setError(result.error ?? "Login gagal");
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#faf9f5' }}
    >
      {/* Left panel — dark with branding */}
      <div
        className="hidden lg:flex lg:w-[480px] flex-col justify-between p-12 flex-shrink-0"
        style={{ backgroundColor: '#181715' }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-full text-white font-semibold"
            style={{ width: 36, height: 36, backgroundColor: '#cc785c', fontSize: '1rem', fontFamily: 'var(--font-display, serif)' }}
          >
            ✦
          </div>
          <span style={{ color: '#faf9f5', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-sans, Inter, sans-serif)', letterSpacing: '-0.01em' }}>
            S.A.V.O.R.I
          </span>
        </div>

        {/* Hero quote */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '2.25rem', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#faf9f5', marginBottom: '1rem' }}>
            Kenali bisnis Anda lebih dalam — satu struk sekaligus.
          </h1>
          <p style={{ color: '#a09d96', fontSize: '0.9375rem', lineHeight: 1.6, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            Platform intelijen bisnis berbasis AI untuk restoran dan kafe. Analisis data penjualan, scan struk otomatis, dan dapatkan insight secara real-time.
          </p>
        </div>

        {/* Footer tag */}
        <p style={{ color: '#6c6a64', fontSize: '0.8125rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
          © 2025 S.A.V.O.R.I · Smart AI-Powered Business Intelligence
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#cc785c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.875rem' }}>✦</div>
            <span style={{ fontWeight: 600, color: '#141413', fontSize: '0.9375rem' }}>S.A.V.O.R.I</span>
          </div>

          {/* Label */}
          <p style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#cc785c', marginBottom: '0.5rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
            Selamat datang kembali
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '2rem', fontWeight: 400, letterSpacing: '-0.02em', color: '#141413', marginBottom: '2rem', lineHeight: 1.15 }}>
            Masuk ke akun Anda
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3d3d3a', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.875rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e6dfd8',
                  backgroundColor: '#faf9f5',
                  color: '#141413',
                  fontSize: '0.9375rem',
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#cc785c')}
                onBlur={e => (e.target.style.borderColor = '#e6dfd8')}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3d3d3a', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.875rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e6dfd8',
                  backgroundColor: '#faf9f5',
                  color: '#141413',
                  fontSize: '0.9375rem',
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#cc785c')}
                onBlur={e => (e.target.style.borderColor = '#e6dfd8')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '40px',
                backgroundColor: isLoading ? '#e6dfd8' : '#cc785c',
                color: isLoading ? '#6c6a64' : '#ffffff',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 150ms ease',
                marginTop: '0.5rem',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = '#a9583e'; }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = '#cc785c'; }}
            >
              {isLoading ? 'Masuk...' : 'Masuk'}
            </button>

            <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6c6a64', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                Belum punya akun?{' '}
              </span>
              <button
                type="button"
                onClick={() => router.push('/register')}
                style={{ fontSize: '0.875rem', fontWeight: 500, color: '#cc785c', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
              >
                Daftar sekarang
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}