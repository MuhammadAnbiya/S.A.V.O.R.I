'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TalkToDataPanel from '@/components/chat/TalkToDataPanel';
import {
  LayoutDashboard,
  Database,
  Upload,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  Scan,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/input-data', label: 'Input Data', icon: Upload },
  { href: '/dashboard/database', label: 'Database', icon: Database },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: '#faf9f5' }}>
      {/* ── Dark Sidebar ────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? '72px' : '224px',
          backgroundColor: '#181715',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 py-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)', minHeight: '64px' }}
        >
          {/* Spike mark – styled after Anthropic asterisk */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#cc785c',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: 'var(--font-display, serif)',
            }}
          >
            ✦
          </div>
          {!collapsed && (
            <span
              className="font-semibold tracking-tight"
              style={{
                color: '#faf9f5',
                fontSize: '0.9375rem',
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                letterSpacing: '-0.01em',
              }}
            >
              S.A.V.O.R.I
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : '0.625rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  color: active ? '#faf9f5' : '#a09d96',
                  backgroundColor: active ? '#252320' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#252320';
                    (e.currentTarget as HTMLElement).style.color = '#faf9f5';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#a09d96';
                  }
                }}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pb-4 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.625rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'transparent',
              color: '#a09d96',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#252320';
              (e.currentTarget as HTMLElement).style.color = '#faf9f5';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#a09d96';
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Logout */}
          <a
            href="/logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              color: '#a09d96',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background-color 150ms ease, color 150ms ease',
              marginTop: '0.25rem',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#252320';
              (e.currentTarget as HTMLElement).style.color = '#c64545';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#a09d96';
            }}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </a>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 z-10"
          style={{
            height: '64px',
            backgroundColor: '#faf9f5',
            borderBottom: '1px solid #e6dfd8',
          }}
        >
          {/* Page breadcrumb — will show current route name */}
          <div style={{ fontSize: '0.875rem', color: '#6c6a64', fontWeight: 500 }}>
            {navItems.find(n => pathname.startsWith(n.href))?.label ?? 'Dashboard'}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full font-semibold text-sm"
              style={{
                width: 34,
                height: 34,
                backgroundColor: '#cc785c',
                color: '#fff',
              }}
            >
              U
            </div>
          </div>
        </header>

        {/* Page */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-40 md:pb-24"
        >
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181715] border-t border-[rgba(255,255,255,0.06)] px-2 flex justify-around items-center shadow-2xl" 
        style={{ height: '70px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
              style={{ color: active ? '#cc785c' : '#a09d96' }}
            >
              <Icon size={20} className={active ? 'drop-shadow-md' : ''} />
              <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Talk to Data floating panel */}
      <TalkToDataPanel />
    </div>
  );
}