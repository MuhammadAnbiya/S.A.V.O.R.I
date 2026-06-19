import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function POST(request: NextRequest) {
  try {
    const { userMessage, csvSummary, conversationHistory = [] } = await request.json();

    if (!userMessage?.trim()) {
      return NextResponse.json({ explanation: 'Silakan ketik pertanyaan Anda.' });
    }

    if (!csvSummary) {
      return NextResponse.json({ explanation: 'Data CSV belum diunggah. Silakan unggah file CSV Anda terlebih dahulu.' });
    }

    if (!GROQ_API_KEY) {
       // Fallback mock response if no API key
       return NextResponse.json({ 
         explanation: 'Sistem AI belum dikonfigurasi (GROQ_API_KEY tidak ditemukan). Namun berdasarkan data CSV Anda, sistem berjalan normal.' 
       });
    }

    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const systemPrompt = `Kamu adalah asisten analis data keuangan POS (Point of Sale) untuk platform S.A.V.O.R.I.
Tugasmu adalah menjawab pertanyaan user secara TEPAT, DETAIL, dan AKURAT berdasarkan data statistik CSV yang diberikan.

Hari ini: ${today}

═══════════════════════════════════════════
DATA STATISTIK CSV POS (SUMBER KEBENARAN)
═══════════════════════════════════════════
${JSON.stringify(csvSummary, null, 2)}

═══════════════════════════════════════════
PANDUAN INTERPRETASI DATA
═══════════════════════════════════════════
• totalRows = jumlah total baris transaksi dalam CSV
• totalRevenue = total semua pendapatan (penjualan positif)
• totalRefunds = total pengembalian dana (penjualan negatif)
• netRevenue = totalRevenue - totalRefunds
• averageTransactionValue = rata-rata nilai per transaksi
• maxTransaction = transaksi dengan nilai tertinggi (termasuk waktu dan lokasi)
• minTransaction = transaksi dengan nilai terendah (termasuk waktu dan lokasi)
• revenueByChannel = pendapatan per saluran/tipe pesanan, sudah diurutkan dari terbesar
• revenueByMonthSorted = pendapatan per bulan, SUDAH DIURUTKAN dari terbesar ke terkecil (bulan pertama = bulan terlaris)
• revenueByDayOfWeek = total pendapatan per hari dalam seminggu (Senin-Minggu)
• hourlyBreakdownSorted = pendapatan dan jumlah transaksi per jam, SUDAH DIURUTKAN dari terbesar
• top10HighestRevenueDays = 10 hari dengan pendapatan tertinggi
• top5LowestRevenueDays = 5 hari dengan pendapatan terendah
• totalUniqueDays = jumlah hari unik dalam dataset
• dateRange = rentang tanggal awal dan akhir data

═══════════════════════════════════════════
ATURAN KETAT WAJIB DIPATUHI
═══════════════════════════════════════════
1. Jawab HANYA berdasarkan data statistik di atas. DILARANG KERAS mengarang, mengasumsikan, atau menyebutkan data yang tidak ada dalam rangkuman.
2. Jika data yang diminta BENAR-BENAR TIDAK ADA dalam rangkuman, katakan secara jujur: "Data tersebut tidak tersedia dalam rangkuman yang diproses."
3. Format Rupiah: Rp XX.XXX.XXX (titik pemisah ribuan). Contoh: Rp 1.237.489.283
4. GAYA BAHASA: Formal, struktural, profesional. Susun jawaban dengan rapi layaknya analis keuangan senior.
5. JANGAN gunakan format markdown (seperti ** atau #). Gunakan teks biasa dengan nomor atau bullet (•) untuk daftar.
6. Berikan INSIGHT tambahan yang relevan dari data yang tersedia untuk memperkaya jawaban.
7. Untuk pertanyaan tentang "bulan terbaik", lihat field revenueByMonthSorted — elemen pertama adalah bulan dengan pendapatan terbesar.
8. Untuk pertanyaan tentang "hari terbaik", lihat top10HighestRevenueDays.
9. Untuk pertanyaan tentang "jam tersibuk", lihat hourlyBreakdownSorted.
10. SELALU sertakan ANGKA SPESIFIK dalam jawaban — jangan pernah menjawab secara umum tanpa angka.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 1200,
        temperature: 0.05, 
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Groq API error ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Maaf, tidak ada respons dari AI.';

    return NextResponse.json({
      explanation: answer,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Sales Talk to Data error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
