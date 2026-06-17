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
    const rawContent = resJson.choices[0]?.message?.content || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error('Failed to parse LLM JSON:', rawContent);
      throw new Error('Format output AI tidak valid');
    }

    // ── Robust Validation & Sanitization Layer ─────────────────────
    const sanitizedData = sanitizeReceiptData(parsedData);

    return NextResponse.json({
      status: 'success',
      data: sanitizedData,
      metadata: {
        engine: 'groq-llama',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error parsing OCR with LLM:', message);
    return NextResponse.json({ status: 'error', error: { message } }, { status: 500 });
  }
}

// ── Validation and Sanitization Helper ──────────────────────────
function sanitizeReceiptData(raw: any): any {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Sanitize Vendor Name
  const vendorNameObj = raw.vendor_name || {};
  let vendorName = String(vendorNameObj.value || '').trim();
  if (!vendorName || vendorName.toLowerCase() === 'tidak teridentifikasi') {
    vendorName = 'Tidak Teridentifikasi';
  }
  const vendorConfidence = typeof vendorNameObj.confidence === 'number' ? vendorNameObj.confidence : 0.7;

  // 2. Sanitize Transaction Date
  const dateObj = raw.transaction_date || {};
  let dateVal = String(dateObj.value || '').trim();
  // Validate YYYY-MM-DD
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateVal);
  if (!isValidDate) {
    dateVal = todayStr; // fallback to today
  }
  const dateConfidence = typeof dateObj.confidence === 'number' ? dateObj.confidence : 0.8;

  // 3. Sanitize Items
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const sanitizedItems = rawItems
    .map((item: any, idx: number) => {
      const nameObj = item.name || {};
      const name = String(nameObj.value || nameObj || '').trim();
      if (!name) return null; // Skip empty item names

      const qtyObj = item.quantity || {};
      const qty = Math.max(1, Number(qtyObj.value !== undefined ? qtyObj.value : (qtyObj || 1)));

      const unitObj = item.unit || {};
      const unit = String(unitObj.value || unitObj || 'pcs').trim() || 'pcs';

      const priceObj = item.unit_price || {};
      const price = Math.max(0, Number(priceObj.value !== undefined ? priceObj.value : (priceObj || 0)));

      // Subtotal calculation check
      const subtotalObj = item.subtotal || {};
      let subtotal = Math.max(0, Number(subtotalObj.value !== undefined ? subtotalObj.value : (subtotalObj || 0)));
      
      // Force correct arithmetic calculation to prevent rounding/calculation errors
      const calculatedSubtotal = qty * price;
      if (subtotal === 0 || subtotal !== calculatedSubtotal) {
        subtotal = calculatedSubtotal;
      }

      return {
        name: { value: name, confidence: typeof nameObj.confidence === 'number' ? nameObj.confidence : 0.8 },
        quantity: { value: qty, confidence: typeof qtyObj.confidence === 'number' ? qtyObj.confidence : 0.8 },
        unit: { value: unit, confidence: typeof unitObj.confidence === 'number' ? unitObj.confidence : 0.8 },
        unit_price: { value: price, confidence: typeof priceObj.confidence === 'number' ? priceObj.confidence : 0.8 },
        subtotal: { value: subtotal, confidence: typeof subtotalObj.confidence === 'number' ? subtotalObj.confidence : 0.8 }
      };
    })
    .filter(Boolean);

  // 4. Sanitize Total Amount
  const totalObj = raw.total_amount || {};
  let totalVal = Number(totalObj.value !== undefined ? totalObj.value : (totalObj || 0));

  // Sum up all subtotals
  const sumOfSubtotals = sanitizedItems.reduce((sum: number, it: any) => sum + it.subtotal.value, 0);

  // If items exist, force total_amount to equal the sum of item subtotals for absolute financial consistency
  if (sanitizedItems.length > 0) {
    totalVal = sumOfSubtotals;
  } else {
    totalVal = Math.max(0, totalVal);
  }

  // If there are no items but we have a total amount, create a generic item to match
  if (sanitizedItems.length === 0 && totalVal > 0) {
    sanitizedItems.push({
      name: { value: 'Item tidak teridentifikasi', confidence: 0.5 },
      quantity: { value: 1, confidence: 0.5 },
      unit: { value: 'pcs', confidence: 0.5 },
      unit_price: { value: totalVal, confidence: 0.5 },
      subtotal: { value: totalVal, confidence: 0.5 }
    });
  }

  const totalConfidence = typeof totalObj.confidence === 'number' ? totalObj.confidence : 0.8;

  return {
    vendor_name: { value: vendorName, confidence: vendorConfidence },
    transaction_date: { value: dateVal, confidence: dateConfidence },
    items: sanitizedItems,
    total_amount: { value: totalVal, confidence: totalConfidence }
  };
}
