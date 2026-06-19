import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { processQuery } from '@/lib/smart-query-engine';

// ── Groq LLM Integration (OpenAI-compatible API) ──────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface TransactionItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  transaction_date: string;
  type: string;
  category: string;
  amount: number;
  vendor_name: string | null;
  branch: string | null;
  payment_method: string | null;
  notes: string | null;
  items?: TransactionItem[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: string;
}

// ── Format transactions as compact context for the LLM ────────────
function buildContext(transactions: Transaction[]): string {
  if (!transactions || transactions.length === 0) {
    return 'Tidak ada data transaksi pengeluaran di database.';
  }

  const lines = transactions.slice(0, 200).map(t => {
    const date = new Date(t.transaction_date).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const itemList = t.items && t.items.length > 0
      ? t.items.map((item) => `${item.name} (${item.qty}x Rp${item.price})`).join(', ')
      : '-';
    
    let line = `- ${date} | Vendor: ${t.vendor_name || '-'} | Kategori: ${t.category || '-'} | Metode: ${t.payment_method || '-'} | Cabang: ${t.branch || '-'} | Total: Rp${t.amount} | Items: [${itemList}]`;
    if (t.notes) line += ` | Catatan: ${t.notes}`;
    return line;
  });

  return lines.join('\n');
}

// ── Format CSV POS summary as compact context for the LLM ──────────
function buildCSVContext(csvSummary: any): string {
  if (!csvSummary) {
    return 'Tidak ada data CSV POS yang diunggah saat ini.';
  }

  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const channelText = Array.isArray(csvSummary.revenueByChannel)
    ? csvSummary.revenueByChannel.map((c: any) => `${c.channel}: ${formatRp(c.revenue)} (${c.count} transaksi)`).join('\n    ')
    : '-';

  const monthText = Array.isArray(csvSummary.revenueByMonthSorted)
    ? csvSummary.revenueByMonthSorted.map((m: any) => `${m.month}: ${formatRp(m.revenue)} (${m.transactionCount} transaksi)`).join('\n    ')
    : '-';

  const hourlyText = Array.isArray(csvSummary.hourlyBreakdownSorted)
    ? csvSummary.hourlyBreakdownSorted.slice(0, 5).map((h: any) => `${h.hour}: ${formatRp(h.revenue)} (${h.transactionCount} transaksi)`).join('\n    ')
    : '-';

  const topDaysText = Array.isArray(csvSummary.top10HighestRevenueDays)
    ? csvSummary.top10HighestRevenueDays.slice(0, 5).map((d: any) => `${d.date}: ${formatRp(d.revenue)}`).join('\n    ')
    : '-';

  return `
  - Total Pendapatan Kotor POS: ${formatRp(csvSummary.totalRevenue)}
  - Total Refund POS: ${formatRp(csvSummary.totalRefunds)}
  - Total Pendapatan Bersih POS: ${formatRp(csvSummary.netRevenue)}
  - Rata-rata Transaksi POS: ${formatRp(csvSummary.averageTransactionValue)}
  - Total Transaksi POS: ${csvSummary.totalRows}
  - Rentang Tanggal POS: ${csvSummary.dateRange?.start} s/d ${csvSummary.dateRange?.end}
  - Transaksi Terbesar POS: ${formatRp(csvSummary.maxTransaction?.value)} (${csvSummary.maxTransaction?.time} di outlet ${csvSummary.maxTransaction?.location})
  - Transaksi Terkecil POS: ${formatRp(csvSummary.minTransaction?.value)} (${csvSummary.minTransaction?.time} di outlet ${csvSummary.minTransaction?.location})
  - Detail Pendapatan POS per Saluran (Channel):
    ${channelText}
  - Detail Pendapatan POS per Bulan:
    ${monthText}
  - 5 Jam Terpadat POS:
    ${hourlyText}
  - 5 Hari dengan Pendapatan Tertinggi POS:
    ${topDaysText}
  `;
}

// ── Call Groq API ──────────────────────────────────────────────────
async function queryGroq(
  userMessage: string, 
  transactions: Transaction[], 
  csvSummary: any,
  history: ChatMessage[], 
  mode: string = 'formal'
): Promise<string> {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayISO = new Date().toISOString().split('T')[0];

  const systemPrompt = `Kamu adalah asisten analis data bisnis S.A.V.O.R.I. Kamu membantu pemilik usaha menganalisis keuangan bisnis mereka dari dua sumber data yang tersedia:

1. DATA OPERASIONAL & PENGELUARAN (Diambil dari Riwayat Pembelian Database):
${buildContext(transactions)}

2. DATA PENDAPATAN & KASIR POS (Diambil dari File CSV POS yang diunggah):
${buildCSVContext(csvSummary)}

ATURAN PERTANYAAN:
- Jika user bertanya tentang PENGELUARAN, OPERASIONAL, PEMBELIAN VENDOR, atau BARANG BELANJAAN, jawab menggunakan DATA 1.
- Jika user bertanya tentang PENDAPATAN, TRANSAKSI KASIR, OUTLET, JAM SIBUK, atau SALURAN PENJUALAN POS, jawab menggunakan DATA 2.
- Jika user bertanya tentang perbandingan keduanya (misalnya untung/rugi, margin profit, profitabilitas), hitung secara matematis: Pendapatan Bersih POS (DATA 2) minus Total Pengeluaran (DATA 1).
- Jika data pengeluaran (DATA 1) kosong, katakan "Data pengeluaran di database kosong". Jika data POS (DATA 2) kosong, katakan "Anda belum mengunggah file CSV POS di dashboard".

ATURAN KETAT:
1. Jawab HANYA berdasarkan data di atas. DILARANG KERAS mengarang atau mengasumsikan data yang tidak ada.
2. Jika tidak ada data yang cocok, katakan "Tidak ada data yang sesuai" atau "Maaf, data tersebut tidak tersedia."
3. Format Rupiah: Rp XX.XXX (titik pemisah ribuan).
4. GAYA BAHASA: ${mode === 'santai' 
  ? 'SANGAT SANTAI, HYPED, DAN GAUL! Gunakan bahasa tongkrongan (lu/gue, bro/sis, mantap, gokil, dsb). Jadilah se-asik mungkin, seperti sahabat yang sangat antusias! DILARANG KERAS menggunakan bahasa baku.' 
  : 'SANGAT FORMAL, STRUKTURAL, DAN PROFESIONAL. Gunakan Bahasa Indonesia baku (EYD), sapa dengan "Anda", dan susun jawaban dengan sangat rapi layaknya konsultan keuangan senior.'}
5. Jangan gunakan format markdown (** atau #). Gunakan teks biasa dengan nomor atau bullet (•) untuk daftar.
6. HITUNG DENGAN TELITI DARI DATA SECARA MATEMATIS — jangan pernah memperkirakan atau menebak. Lakukan pengecekan ganda secara internal sebelum menjawab.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((m) => ({
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
      max_tokens: 700,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API error ${response.status}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Maaf, tidak ada respons dari AI.';
}

// ── Route Handler ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userMessage, conversationHistory = [], mode = 'formal', csvSummary } = await request.json();

    if (!userMessage?.trim()) {
      return NextResponse.json({ explanation: 'Silakan ketik pertanyaan Anda.' });
    }

    // Fetch all user transactions with items
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, transaction_date, type, category, amount, vendor_name, branch, payment_method, notes,
        items:transaction_items(name, qty, price, subtotal)
      `)
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .limit(500);

    if (error) throw error;

    let answer: string;

    // Try Groq LLM first (if key is configured)
    if (GROQ_API_KEY) {
      try {
        answer = await queryGroq(userMessage, transactions || [], csvSummary, conversationHistory, mode);
        console.log(`[Talk to Data] Groq LLM responded successfully`);
      } catch (groqErr) {
        const message = groqErr instanceof Error ? groqErr.message : String(groqErr);
        console.warn('[Talk to Data] Groq failed:', message);
        
        if (message.includes('Rate limit') || message.includes('429')) {
          answer = "Maaf, sistem AI sedang menerima terlalu banyak permintaan (Rate Limit). Mohon tunggu sekitar 3-5 menit sebelum mencoba lagi. 🙏";
        } else {
          console.warn('[Talk to Data] Falling back to Smart Query Engine');
          answer = processQuery(userMessage, transactions || []);
        }
      }
    } else {
      console.log('[Talk to Data] No GROQ_API_KEY set, using Smart Query Engine');
      answer = processQuery(userMessage, transactions || []);
    }

    return NextResponse.json({
      query: userMessage,
      results: [],
      chartType: 'text',
      explanation: answer,
      mode: mode,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Talk to Data error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
