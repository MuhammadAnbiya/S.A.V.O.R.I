'use client';

export default function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  const prompts = [
    "Ringkasan penjualan minggu ini",
    "Top 5 produk terlaris bulan lalu",
    "Bandingkan cabang Sudirman vs Kemang",
    "Prediksi pendapatan minggu depan"
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelect(prompt)}
          className="text-xs bg-main hover:bg-primary/10 hover:text-primary text-text-secondary px-3 py-1.5 rounded-full border border-transparent hover:border-primary/20 transition-colors text-left"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
