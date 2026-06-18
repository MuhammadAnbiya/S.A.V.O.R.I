import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { processQuery } from '@/lib/smart-query-engine';

// ── Groq LLM Integration (OpenAI-compatible API) ──────────────────
// Daftar gratis di https://console.groq.com → dapat API key seketika
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // KEMBALI KE 70B: Model kecil (8B) terlalu bodoh untuk ekstraksi data kompleks

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
    return 'Tidak ada data transaksi.';
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

// ── Call Groq API ──────────────────────────────────────────────────
async function queryGroq(userMessage: string, transactions: Transaction[], history: ChatMessage[], mode: string = 'formal'): Promise<string> {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const todayISO = new Date().toISOString().split('T')[0]; // e.g. "2026-06-18"

  const systemPrompt = `Kamu adalah asisten analis data S.A.V.O.R.I. Jawab pertanyaan user HANYA berdasarkan data transaksi di bawah.

Hari ini: ${today} (${todayISO})

DATA TRANSAKSI:
${buildContext(transactions)}

ATURAN KETAT:
1. Jawab HANYA berdasarkan data di atas. DILARANG KERAS mengarang atau mengasumsikan data yang tidak ada.
2. Jika tidak ada data yang cocok, katakan "Tidak ada data yang sesuai" — jangan coba menjawab dengan data lain.
3. Untuk pertanyaan waktu ("minggu ini", "bulan ini"), filter tanggal dari data dengan benar. Minggu ini = Senin s.d. hari ini.
4. Format Rupiah: Rp XX.XXX (titik pemisah ribuan).
5. GAYA BAHASA: ${mode === 'santai' 
  ? 'SANGAT SANTAI, HYPED, DAN GAUL! Gunakan bahasa tongkrongan (lu/gue, bro/sis, mantap, gokil, dsb). Jadilah se-asik mungkin, seperti sahabat yang sangat antusias! DILARANG KERAS menggunakan bahasa baku.' 
  : 'SANGAT FORMAL, STRUKTURAL, DAN PROFESIONAL. Gunakan Bahasa Indonesia baku (EYD), sapa dengan "Anda", dan susun jawaban dengan sangat rapi layaknya konsultan keuangan senior.'}
6. Jangan gunakan format markdown (** atau #). Gunakan teks biasa dengan nomor atau bullet (•) untuk daftar.
7. BERPIKIRLAH SEPERTI AKUNTAN: Jika ditanya total/jumlah, HITUNG DENGAN TELITI DARI DATA SECARA MATEMATIS — jangan pernah memperkirakan atau menebak. Lakukan pengecekan ganda secara internal sebelum menjawab.`;

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
      max_tokens: 600,
      temperature: 0.1, // Near-zero for factual accuracy
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

    const { userMessage, conversationHistory = [], mode = 'formal' } = await request.json();

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
        answer = await queryGroq(userMessage, transactions || [], conversationHistory, mode);
        console.log(`[Talk to Data] Groq LLM responded successfully`);
      } catch (groqErr) {
        const message = groqErr instanceof Error ? groqErr.message : String(groqErr);
        console.warn('[Talk to Data] Groq failed, falling back to Smart Query Engine:', message);
        // Fallback to rule-based engine
        answer = processQuery(userMessage, transactions || []);
      }
    } else {
      // No LLM key — use rule-based engine
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
