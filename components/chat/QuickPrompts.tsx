'use client';

const prompts = [
  'Ringkasan penjualan minggu ini',
  'Top 5 produk terlaris bulan lalu',
  'Bandingkan cabang Sudirman vs Kemang',
  'Prediksi pendapatan minggu depan',
];

export default function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.375rem',
        marginBottom: '0.625rem',
      }}
    >
      {prompts.map((prompt, i) => (
        <button
          key={i}
          onClick={() => onSelect(prompt)}
          style={{
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            border: '1px solid #e6dfd8',
            backgroundColor: '#faf9f5',
            color: '#cc785c',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            transition: 'background-color 150ms ease, border-color 150ms ease',
            textAlign: 'left',
            lineHeight: 1.4,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(204,120,92,0.08)';
            (e.currentTarget as HTMLElement).style.borderColor = '#cc785c';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#faf9f5';
            (e.currentTarget as HTMLElement).style.borderColor = '#e6dfd8';
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
