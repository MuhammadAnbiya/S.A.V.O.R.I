import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { extractReceiptData } from '@/lib/gemini';
import { extractReceiptDataQwen } from '@/lib/qwen-vl';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ status: 'error', error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { imageBase64, mimeType } = await request.json();
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ status: 'error', error: { message: 'Missing image data' } }, { status: 400 });
    }

    const engineMode = process.env.VISION_ENGINE || 'gemini';
    let parsedData;

    if (engineMode === 'qwen') {
      if (!process.env.QWEN_API_KEY) {
        return NextResponse.json({ 
          status: 'error', 
          error: { message: 'QWEN_API_KEY not configured' } 
        }, { status: 500 });
      }
      parsedData = await extractReceiptDataQwen(imageBase64, mimeType);
    } else {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ 
          status: 'error', 
          error: { message: 'GEMINI_API_KEY not configured' } 
        }, { status: 500 });
      }
      parsedData = await extractReceiptData(imageBase64, mimeType);
    }

    // Apply the exact same robust sanitization logic we built for Groq
    const sanitizedData = sanitizeReceiptData(parsedData);

    return NextResponse.json({
      status: 'success',
      data: sanitizedData,
      metadata: {
        engine: (parsedData as any)._extracted_by_model || 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Vision extraction error:', message);
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

  const vendorRaw = raw.vendor_name;
  let vendorName = String(extractVal(vendorRaw, '')).trim();
  if (!vendorName || vendorName.length < 2) {
    vendorName = 'Tidak Teridentifikasi';
  }

  const dateRaw = raw.transaction_date;
  let dateVal = String(extractVal(dateRaw, '')).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    dateVal = todayStr;
  }
  const parsedDate = new Date(dateVal + 'T00:00:00Z');
  if (isNaN(parsedDate.getTime())) {
    dateVal = todayStr;
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const sanitizedItems: SanitizedItem[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const itemObj = item as Record<string, unknown>;

    const name = String(extractVal(itemObj.name, '')).trim();
    if (!name || name.length < 1) continue;

    const qty = Math.max(1, Math.round(Number(extractVal(itemObj.quantity, 1)) || 1));
    const unit = String(extractVal(itemObj.unit, 'pcs')).trim() || 'pcs';
    const unitPrice = Math.round(Number(extractVal(itemObj.unit_price, 0)) || 0);

    // CRITICAL: Always force subtotal = qty * unit_price
    const subtotal = qty * unitPrice;

    sanitizedItems.push({
      name: { value: name, confidence: extractConf(itemObj.name) },
      quantity: { value: qty, confidence: extractConf(itemObj.quantity) },
      unit: { value: unit, confidence: extractConf(itemObj.unit) },
      unit_price: { value: unitPrice, confidence: extractConf(itemObj.unit_price) },
      subtotal: { value: subtotal, confidence: extractConf(itemObj.subtotal) },
    });
  }

  const totalFromItems = sanitizedItems.reduce((sum, it) => sum + it.subtotal.value, 0);
  
  let totalVal = totalFromItems;
  if (sanitizedItems.length === 0) {
    totalVal = Math.max(0, Math.round(Number(extractVal(raw.total_amount, 0)) || 0));
    if (totalVal > 0) {
      sanitizedItems.push({
        name: { value: 'Item tidak teridentifikasi', confidence: 0.3 },
        quantity: { value: 1, confidence: 0.3 },
        unit: { value: 'pcs', confidence: 0.3 },
        unit_price: { value: totalVal, confidence: 0.3 },
        subtotal: { value: totalVal, confidence: 0.3 },
      });
    }
  }

  return {
    vendor_name: { value: vendorName, confidence: extractConf(vendorRaw) },
    transaction_date: { value: dateVal, confidence: extractConf(dateRaw) },
    items: sanitizedItems,
    total_amount: { value: totalVal, confidence: extractConf(raw.total_amount) },
  };
}
