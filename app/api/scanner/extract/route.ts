import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama3-8b-8192'; // Menggunakan 8B untuk menghindari rate limit saat testing

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
        error: { message: 'GROQ_API_KEY not configured' } 
      }, { status: 500 });
    }

    const systemPrompt = `Kamu adalah mesin parser struk belanja Indonesia yang sangat teliti. Tugasmu mengubah teks OCR menjadi JSON terstruktur.

ATURAN KETAT — ikuti tanpa pengecualian:
1. Output HANYA JSON valid, tanpa teks lain.
2. Semua angka harus integer (tanpa desimal, tanpa titik pemisah ribuan, tanpa "Rp").
3. Hati-hati menentukan Quantity vs Harga. Quantity umumnya kecil (1-50). Jika tertulis "20.000 x 1", maka unit_price=20000, quantity=1.
4. subtotal setiap item HARUS BENAR SECARA MATEMATIS = quantity × unit_price. 
5. PENANGANAN DISKON: Jika ada diskon untuk seluruh transaksi, masukkan sebagai 1 item baru bernama "Diskon" atau "Potongan Harga" dengan quantity=1 dan unit_price bernilai NEGATIF (misal -5000), sehingga subtotalnya juga negatif (-5000).
6. total_amount HARUS = jumlah seluruh subtotal item (termasuk item diskon yang negatif).
7. transaction_date dalam format YYYY-MM-DD. Jika di struk tertulis "23-05-2026", hasilnya "2026-05-23".
8. Perbaiki typo dari OCR (misal "Ayan" → "Ayam", "Uncattos" → nama toko asli jika bisa ditebak).
9. Abaikan teks sampah (No, Date, Kasir, Nama, Bayar, Kembali, Terima Kasih, alamat, nomor telepon).
10. Jika ada baris nama item TANPA harga, dan baris berikutnya berisi "harga x qty = subtotal", gabungkan mereka sebagai satu item.

Schema JSON:
{
  "vendor_name": { "value": "string", "confidence": 0.0-1.0 },
  "transaction_date": { "value": "YYYY-MM-DD", "confidence": 0.0-1.0 },
  "items": [
    {
      "name": { "value": "string", "confidence": 0.0-1.0 },
      "quantity": { "value": integer, "confidence": 0.0-1.0 },
      "unit": { "value": "pcs", "confidence": 0.0-1.0 },
      "unit_price": { "value": integer, "confidence": 0.0-1.0 },
      "subtotal": { "value": integer, "confidence": 0.0-1.0 }
    }
  ],
  "total_amount": { "value": integer, "confidence": 0.0-1.0 },
  "payment_method": { "value": "Cash|QRIS|Transfer Bank|Kartu Kredit", "confidence": 0.0-1.0 },
  "notes": { "value": "string (opsional catatan tambahan)", "confidence": 0.0-1.0 }
}`;

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
          { role: 'user', content: `Teks OCR struk:\n\n${rawText}` }
        ],
        temperature: 0.0,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Groq API error body:', errBody);
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const rawContent = resJson.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error('Empty response from Groq');
    }

    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(rawContent);
    } catch {
      console.error('Failed to parse LLM JSON:', rawContent.substring(0, 500));
      throw new Error('LLM returned invalid JSON');
    }

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
    console.error('Scanner extract error:', message);
    return NextResponse.json({ status: 'error', error: { message } }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────

interface SanitizedField<T> {
  value: T;
  confidence: number;
}

interface SanitizedItem {
  name: SanitizedField<string>;
  quantity: SanitizedField<number>;
  unit: SanitizedField<string>;
  unit_price: SanitizedField<number>;
  subtotal: SanitizedField<number>;
}

interface SanitizedReceipt {
  vendor_name: SanitizedField<string>;
  transaction_date: SanitizedField<string>;
  items: SanitizedItem[];
  total_amount: SanitizedField<number>;
  payment_method: SanitizedField<string>;
  notes: SanitizedField<string>;
}

function extractVal(obj: unknown, fallback: unknown = ''): unknown {
  if (obj === null || obj === undefined) return fallback;
  if (typeof obj === 'object' && 'value' in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>).value ?? fallback;
  }
  return obj;
}

function extractConf(obj: unknown, fallback = 0.8): number {
  if (obj !== null && typeof obj === 'object' && 'confidence' in (obj as Record<string, unknown>)) {
    const c = (obj as Record<string, unknown>).confidence;
    return typeof c === 'number' && c >= 0 && c <= 1 ? c : fallback;
  }
  return fallback;
}

function sanitizeReceiptData(raw: Record<string, unknown>): SanitizedReceipt {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Vendor Name
  const vendorRaw = raw.vendor_name;
  let vendorName = String(extractVal(vendorRaw, '')).trim();
  if (!vendorName || vendorName.length < 2) {
    vendorName = 'Tidak Teridentifikasi';
  }

  // 2. Date — validate YYYY-MM-DD strictly
  const dateRaw = raw.transaction_date;
  let dateVal = String(extractVal(dateRaw, '')).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    dateVal = todayStr;
  }
  // Also validate that the date is a real date
  const parsedDate = new Date(dateVal + 'T00:00:00Z');
  if (isNaN(parsedDate.getTime())) {
    dateVal = todayStr;
  }

  // 3. Items
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const sanitizedItems: SanitizedItem[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const itemObj = item as Record<string, unknown>;

    const name = String(extractVal(itemObj.name, '')).trim();
    if (!name || name.length < 1) continue;

    const qty = Math.max(1, Math.round(Number(extractVal(itemObj.quantity, 1)) || 1));
    const unit = String(extractVal(itemObj.unit, 'pcs')).trim() || 'pcs';
    const unitPrice = Math.max(0, Math.round(Number(extractVal(itemObj.unit_price, 0)) || 0));

    // CRITICAL: Always force subtotal = qty * unit_price for absolute arithmetic consistency
    const subtotal = qty * unitPrice;

    sanitizedItems.push({
      name: { value: name, confidence: extractConf(itemObj.name) },
      quantity: { value: qty, confidence: extractConf(itemObj.quantity) },
      unit: { value: unit, confidence: extractConf(itemObj.unit) },
      unit_price: { value: unitPrice, confidence: extractConf(itemObj.unit_price) },
      subtotal: { value: subtotal, confidence: extractConf(itemObj.subtotal) },
    });
  }

  // 4. Total = always sum of subtotals (never trust the LLM's total)
  const totalFromItems = sanitizedItems.reduce((sum, it) => sum + it.subtotal.value, 0);
  
  // If no items were parsed, use the LLM's total as a last resort
  let totalVal = totalFromItems;
  if (sanitizedItems.length === 0) {
    totalVal = Math.max(0, Math.round(Number(extractVal(raw.total_amount, 0)) || 0));
    if (totalVal > 0) {
      // Create a single placeholder item so ExtractionResult can render it
      sanitizedItems.push({
        name: { value: 'Item tidak teridentifikasi', confidence: 0.3 },
        quantity: { value: 1, confidence: 0.3 },
        unit: { value: 'pcs', confidence: 0.3 },
        unit_price: { value: totalVal, confidence: 0.3 },
        subtotal: { value: totalVal, confidence: 0.3 },
      });
    }
  }

  const paymentMethod = String(extractVal(raw.payment_method, 'Cash')).trim();
  const notes = String(extractVal(raw.notes, '')).trim();

  return {
    vendor_name: { value: vendorName, confidence: extractConf(vendorRaw) },
    transaction_date: { value: dateVal, confidence: extractConf(dateRaw) },
    items: sanitizedItems,
    total_amount: { value: totalVal, confidence: extractConf(raw.total_amount) },
    payment_method: { value: paymentMethod, confidence: extractConf(raw.payment_method) },
    notes: { value: notes, confidence: extractConf(raw.notes) },
  };
}
