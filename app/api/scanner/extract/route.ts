import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ status: 'error', error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { rawText } = await request.json();
    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ status: 'error', error: { message: 'Missing rawText parameter' } }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ 
        status: 'error', 
        error: { message: 'Groq API Key not configured. Please add GROQ_API_KEY to your env.' } 
      }, { status: 500 });
    }

    const systemPrompt = `Kamu adalah parser struk belanja (receipt parser) otomatis dalam format JSON.
Tugasmu adalah menganalisis teks hasil OCR dari struk belanja dan mengekstrak data tersebut menjadi JSON yang valid.

Perbaiki ejaan jika nama toko atau barang terpotong/salah baca akibat OCR (misal "Uncattos" menjadi "Lazatto", "Ayan Dada" menjadi "Ayam Dada").

Format JSON wajib mengikuti schema ini:
{
  "vendor_name": { "value": "Nama Toko/Vendor", "confidence": 0.95 },
  "transaction_date": { "value": "YYYY-MM-DD", "confidence": 0.95 },
  "items": [
    {
      "name": { "value": "Nama Barang", "confidence": 0.9 },
      "quantity": { "value": 1, "confidence": 0.9 },
      "unit": { "value": "pcs", "confidence": 0.9 },
      "unit_price": { "value": 15000, "confidence": 0.9 },
      "subtotal": { "value": 15000, "confidence": 0.9 }
    }
  ],
  "total_amount": { "value": 15000, "confidence": 0.95 }
}

Aturan Penting:
1. "transaction_date" harus menggunakan format YYYY-MM-DD (misal: "2026-05-23"). Jika tahun tidak lengkap, asumsikan tahun berjalan atau cari petunjuk di struk.
2. Semua field angka ("quantity", "unit_price", "subtotal", "total_amount") harus bertipe number (integer), bukan string. Jangan sertakan simbol mata uang atau pemisah ribuan.
3. HANYA kembalikan JSON yang valid, tanpa teks penjelasan tambahan apapun di luar objek JSON.
4. "unit" default adalah "pcs".
5. Jika nama barang tertulis di satu baris dan qty/harga di baris lainnya, pasangkan mereka dengan benar.`;

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Ini teks OCR dari struk:\n${rawText}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const parsedData = JSON.parse(resJson.choices[0].message.content);

    return NextResponse.json({
      status: 'success',
      data: parsedData,
      metadata: {
        engine: 'groq-llama',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error parsing OCR with LLM:', error);
    return NextResponse.json({ status: 'error', error: { message: error.message || 'Internal Server Error' } }, { status: 500 });
  }
}
