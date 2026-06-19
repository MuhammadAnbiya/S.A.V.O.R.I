'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, X, Loader2, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import QuickPrompts from './QuickPrompts';
import { useCSVData } from '@/lib/csv-context';
import { parsePOSDate } from '@/lib/csv-parser';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  chartType?: string | null;
  chartData?: unknown[] | null;
  timestamp: string;
  mode?: string;
}

export default function TalkToDataPanel() {
  const { data } = useCSVData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'formal' | 'santai'>('formal');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Compute dynamic welcome message based on CSV upload state
  const welcomeMessage = useMemo<Message>(() => {
    const welcomeText = data && data.length > 0
      ? 'Halo! Saya Asisten Bisnis S.A.V.O.R.I. Data POS Anda telah dimuat! Anda bisa menanyakan apa saja tentang ringkasan pendapatan POS, jam sibuk, cabang terlaris, maupun riwayat pengeluaran operasional di database.'
      : 'Halo! Saya Asisten Bisnis S.A.V.O.R.I. Tanyakan apa saja tentang pengeluaran operasional (riwayat pembelian) di database, atau unggah file CSV POS di dashboard untuk menganalisis pendapatan kasir secara bersamaan.';
    return {
      id: 'welcome',
      role: 'model',
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };
  }, [data]);

  // Combine welcome message and custom chat history cleanly without calling setState in an effect
  const allMessages = useMemo<Message[]>(() => {
    return [welcomeMessage, ...messages];
  }, [welcomeMessage, messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 80);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate POS data summary to pass to the consolidated LLM endpoint
  const csvSummary = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalRevenue = 0;
    let totalRefunds = 0;
    const channels = new Map<string, number>();
    const channelCount = new Map<string, number>();
    const hours = new Map<string, number>();
    const hourRevenue = new Map<string, number>();
    const months = new Map<string, number>();
    const monthCount = new Map<string, number>();
    const daysOfWeek = new Map<string, number>();
    const dailyRevenue = new Map<string, number>();

    const getDayName = (dayIndex: number) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[dayIndex];
    };

    const getMonthName = (monthIndex: number) => {
        const m = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return m[monthIndex];
    };

    let maxTransactionValue = 0;
    let minTransactionValue = Infinity;
    let maxTransactionTime = 'Unknown';
    let minTransactionTime = 'Unknown';
    let maxTransactionVendor = '';
    let minTransactionVendor = '';

    data.forEach(row => {
       if (row.totalPenjualan > 0) {
         totalRevenue += row.totalPenjualan;
         
         if (row.totalPenjualan > maxTransactionValue) {
             maxTransactionValue = row.totalPenjualan;
             maxTransactionTime = `${row.tanggalPenjualan} pukul ${row.waktuPenjualan || 'N/A'}`;
             maxTransactionVendor = row.lokasi || '';
         }
         if (row.totalPenjualan < minTransactionValue) {
             minTransactionValue = row.totalPenjualan;
             minTransactionTime = `${row.tanggalPenjualan} pukul ${row.waktuPenjualan || 'N/A'}`;
             minTransactionVendor = row.lokasi || '';
         }
         
         const ch = row.tipePesanan || 'Unknown';
         channels.set(ch, (channels.get(ch) || 0) + row.totalPenjualan);
         channelCount.set(ch, (channelCount.get(ch) || 0) + 1);

         if (row.waktuPenjualan) {
           const hr = row.waktuPenjualan.split(':')[0].padStart(2, '0');
           hours.set(hr, (hours.get(hr) || 0) + 1);
           hourRevenue.set(hr, (hourRevenue.get(hr) || 0) + row.totalPenjualan);
         }
         
         if (row.tanggalPenjualan) {
            const dObj = parsePOSDate(row.tanggalPenjualan);
            if (dObj) {
                const monthName = `${getMonthName(dObj.getMonth())} ${dObj.getFullYear()}`;
                const dayName = getDayName(dObj.getDay());
                months.set(monthName, (months.get(monthName) || 0) + row.totalPenjualan);
                monthCount.set(monthName, (monthCount.get(monthName) || 0) + 1);
                daysOfWeek.set(dayName, (daysOfWeek.get(dayName) || 0) + row.totalPenjualan);
                
                const dateKey = `${dObj.getDate().toString().padStart(2,'0')}/${(dObj.getMonth()+1).toString().padStart(2,'0')}/${dObj.getFullYear()}`;
                dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) || 0) + row.totalPenjualan);
            }
         }
       } else if (row.totalPenjualan < 0) {
         totalRefunds += Math.abs(row.totalPenjualan);
       }
    });

    const topDays = Array.from(dailyRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([date, rev]) => ({ date, revenue: rev }));

    const bottomDays = Array.from(dailyRevenue.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([date, rev]) => ({ date, revenue: rev }));

    const monthsSorted = Array.from(months.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([month, rev]) => ({ month, revenue: rev, transactionCount: monthCount.get(month) || 0 }));

    const hoursSorted = Array.from(hourRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([hour, rev]) => ({ hour: `${hour}:00`, revenue: rev, transactionCount: hours.get(hour) || 0 }));

    return {
      totalRows: data.length,
      totalRevenue,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds,
      averageTransactionValue: data.filter(r => r.totalPenjualan > 0).length > 0 
        ? totalRevenue / data.filter(r => r.totalPenjualan > 0).length 
        : 0,
      maxTransaction: {
        value: maxTransactionValue,
        time: maxTransactionTime,
        location: maxTransactionVendor,
      },
      minTransaction: {
        value: minTransactionValue === Infinity ? 0 : minTransactionValue,
        time: minTransactionTime,
        location: minTransactionVendor,
      },
      revenueByChannel: Array.from(channels.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, rev]) => ({ channel: name, revenue: rev, count: channelCount.get(name) || 0 })),
      revenueByMonthSorted: monthsSorted,
      revenueByDayOfWeek: Object.fromEntries(daysOfWeek),
      hourlyBreakdownSorted: hoursSorted,
      top10HighestRevenueDays: topDays,
      top5LowestRevenueDays: bottomDays,
      totalUniqueDays: dailyRevenue.size,
      dateRange: {
        start: data[0]?.tanggalPenjualan || 'Unknown',
        end: data[data.length - 1]?.tanggalPenjualan || 'Unknown'
      }
    };
  }, [data]);

  const handleSend = async (text: string = inputValue) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/talk-to-data/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: trimmed,
          mode: mode,
          branchIds: ['Pusat'],
          dateRange: { from: '2026-06-01', to: '2026-06-30' },
          conversationHistory: messages.slice(-10),
          csvSummary: csvSummary, // Send the computed CSV details if present
        }),
      });

      const result = await response.json();

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'model',
        content: result.explanation || 'Maaf, saya tidak dapat menganalisis data tersebut.',
        chartType: result.chartType || null,
        chartData: Array.isArray(result.results) && result.results.length > 0 ? result.results : null,
        timestamp: new Date().toISOString(),
        mode: result.mode,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'model',
        content: 'Terjadi kesalahan saat memproses permintaan. Pastikan koneksi internet Anda stabil.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Dynamic prompts depending on context
  const dynamicPrompts = useMemo(() => {
    if (data && data.length > 0) {
      return [
        'Total pendapatan POS & pengeluaran?',
        'Bagaimana profitabilitas bisnis saya?',
        'Jam berapa transaksi POS paling ramai?',
        'Kategori pengeluaran terbesar?',
      ];
    }
    return [
      'Total pengeluaran bulan ini?',
      'Kategori pengeluaran terbesar?',
      'Vendor transaksi teratas?',
      'Prediksi pengeluaran minggu depan',
    ];
  }, [data]);

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Talk to Data"
          className="fixed z-50 flex items-center justify-center w-[52px] h-[52px] rounded-full border-none shadow-[0_4px_20px_rgba(204,120,92,0.45)] cursor-pointer transition-all duration-150 right-6 bottom-[calc(env(safe-area-inset-bottom)+90px)] md:bottom-6"
          style={{ backgroundColor: '#cc785c', color: '#ffffff' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#a9583e')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#cc785c')}
        >
          <Sparkles size={20} />
        </button>
      )}

      {/* ── Side Panel ────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100%',
            maxWidth: '420px',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#faf9f5',
            borderLeft: '1px solid #e6dfd8',
            boxShadow: '-8px 0 32px rgba(20,20,19,0.1)',
            zIndex: 49,
          }}
        >
          {/* Header */}
          <div
            style={{
              flexShrink: 0,
              padding: '1rem 1.25rem',
              backgroundColor: '#181715',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(204,120,92,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  color: '#cc785c'
                }}
              >
                ✦
              </div>
              <div>
                <p style={{ color: '#faf9f5', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.2, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                  Asisten Bisnis S.A.V.O.R.I
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ color: '#a09d96', fontSize: '0.725rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                    AI Finansial & POS
                  </p>
                  <button
                    onClick={() => setMode(mode === 'formal' ? 'santai' : 'formal')}
                    style={{
                      background: mode === 'santai' ? '#cc785c' : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: mode === 'santai' ? '#fff' : '#a09d96',
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {mode === 'formal' ? 'FORMAL' : 'SANTAI'}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.06)', color: '#a09d96', display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
            className="scrollbar-thin scrollbar-thumb-[#e6dfd8] scrollbar-track-transparent"
          >
            {allMessages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e6dfd8', borderRadius: '0.75rem', borderBottomLeftRadius: '0.25rem', width: 'fit-content', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(20,20,19,0.06)' }}>
                <Loader2 size={14} style={{ color: '#cc785c', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.875rem', color: '#6c6a64', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                  Sedang menganalisis data...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              flexShrink: 0,
              padding: '0.875rem 1rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e6dfd8',
            }}
          >
            <QuickPrompts prompts={dynamicPrompts} onSelect={p => handleSend(p)} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya performa bisnis..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  height: '42px',
                  paddingLeft: '1rem',
                  paddingRight: '3rem',
                  borderRadius: '9999px',
                  border: '1px solid #e6dfd8',
                  backgroundColor: '#faf9f5',
                  color: '#141413',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  position: 'absolute',
                  right: '0.25rem',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: (!inputValue.trim() || isLoading) ? '#e6dfd8' : '#cc785c',
                  color: (!inputValue.trim() || isLoading) ? '#8e8b82' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 150ms ease',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
