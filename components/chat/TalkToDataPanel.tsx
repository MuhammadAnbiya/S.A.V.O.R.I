'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Loader2, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import QuickPrompts from './QuickPrompts';

const INITIAL_MESSAGE = {
  id: 'welcome',
  role: 'model',
  content: 'Halo! Saya AI asisten SAVORI. Anda bisa bertanya apa saja tentang data penjualan, analisis produk, atau prediksi performa cabang.',
  timestamp: new Date().toISOString(),
};

export default function TalkToDataPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'formal' | 'santai'>('formal');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 80);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text: string = inputValue) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
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
          conversationHistory: messages.filter(m => m.id !== 'welcome').slice(-10),
        }),
      });

      const result = await response.json();

      const aiMsg = {
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

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Talk to Data"
          className="fixed z-50 flex items-center justify-center w-[52px] h-[52px] rounded-full border-none shadow-[0_4px_20px_rgba(204,120,92,0.45)] cursor-pointer transition-all duration-150 right-6 bottom-[calc(env(safe-area-inset-bottom)+90px)] md:bottom-6"
          style={{ backgroundColor: '#cc785c', color: '#wffffff' }}
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
                }}
              >
                ✦
              </div>
              <div>
                <p style={{ color: '#faf9f5', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.2, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                  Talk to Data
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ color: '#a09d96', fontSize: '0.75rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
                    AI Business Analyst
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
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.06)', color: '#a09d96', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
          >
            {messages.map(msg => (
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
            <QuickPrompts onSelect={p => handleSend(p)} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan performa bisnis..."
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
                  fontSize: '0.9375rem',
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = '#cc785c')}
                onBlur={e => (e.target.style.borderColor = '#e6dfd8')}
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
