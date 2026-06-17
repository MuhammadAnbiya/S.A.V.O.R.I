import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { processQuery } from '@/lib/smart-query-engine';

// ── Groq LLM Integration (OpenAI-compatible API) ──────────────────
// Daftar gratis di https://console.groq.com → dapat API key seketika
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Sangat cepat: ~0.5s response

// ── Format transactions as compact context for the LLM ────────────
function buildContext(transactions: any[]): string {
  if (!transactions || transactions.length === 0) {
    return 'Tidak ada data transaksi.';
  }

  const lines = transactions.slice(0, 200).map(t => {
    const date = new Date(t.transaction_date).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const itemList = t.items?.length > 0
      ? t.items.map((item: any) => `${item.name} (${item.qty}x Rp${item.price})`).join(', ')
      : '-';
    return `- ${date} | Vendor: ${t.vendor_name || '-'} | Kategori: ${t.category || '-'} | Cabang: ${t.branch || '-'} | Total: Rp${t.amount} | Items: [${itemList}]`;
  });

  return lines.join('\n');
}

// ── Call Groq API ──────────────────────────────────────────────────
async function queryGroq(userMessage: string, transactions: any[], history: any[]): Promise<string> {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const systemPrompt = `Kamu adalah asisten analis bisnis S.A.V.O.R.I yang sangat cerdas dan membantu.
Hari ini adalah ${today}.

Data transaksi user (format: tanggal | vendor | kategori | cabang | total | items):
${buildContext(transactions)}

INSTRUKSI:
- Jawab dengan AKURAT berdasarkan data di atas saja.
- Jawab dalam Bahasa Indonesia yang natural dan ramah.
- Gunakan angka Rupiah dengan format "Rp X.XXX" (titik sebagai pemisah ribuan).
- Jika data tidak ada atau tidak relevan, katakan jujur.
- Jawaban harus ringkas, jelas, dan informatif. Maksimal 5-6 kalimat atau daftar singkat.
- Jangan mengarang data yang tidak ada di konteks.
- Jika ditanya soal waktu (hari ini, minggu ini, bulan ini, dll), pastikan kamu memfilter tanggal dari data dengan benar.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    // Include up to last 6 messages of conversation history for context
    ...history.slice(-6).map((m: any) => ({
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
      max_tokens: 512,
      temperature: 0.2, // Low temperature for factual accuracy
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

    const { userMessage, conversationHistory = [] } = await request.json();

    if (!userMessage?.trim()) {
      return NextResponse.json({ explanation: 'Silakan ketik pertanyaan Anda.' });
    }

    // Fetch all user transactions with items
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, transaction_date, type, category, amount, vendor_name, branch,
        items:transaction_items(name, qty, price, subtotal)
      `)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .limit(500);

    if (error) throw error;

    let answer: string;

    // Try Groq LLM first (if key is configured)
    if (GROQ_API_KEY) {
      try {
        answer = await queryGroq(userMessage, transactions || [], conversationHistory);
        console.log(`[Talk to Data] Groq LLM responded successfully`);
      } catch (groqErr: any) {
        console.warn('[Talk to Data] Groq failed, falling back to Smart Query Engine:', groqErr.message);
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
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Talk to Data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
