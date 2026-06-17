/**
 * Receipt OCR Parser — Ekstraksi data struk menggunakan Tesseract.js
 * Tanpa LLM, tanpa API Key, berjalan langsung di browser.
 * Cepat, ringan, dan akurat untuk struk Indonesia.
 */

interface ReceiptField<T> {
  value: T;
  confidence: number;
}

interface ReceiptItem {
  name: ReceiptField<string>;
  quantity: ReceiptField<number>;
  unit: ReceiptField<string>;
  unit_price: ReceiptField<number>;
  subtotal: ReceiptField<number>;
}

interface ReceiptResult {
  vendor_name: ReceiptField<string>;
  transaction_date: ReceiptField<string>;
  items: ReceiptItem[];
  total_amount: ReceiptField<number>;
}

// ── Price Parsing ──────────────────────────────────────────

function parsePrice(text: string): number {
  // Handle formats: Rp 15.000, Rp15,000, 15000, Rp. 15.000,00
  let clean = text
    .replace(/[Rr][Pp]\.?\s*/g, '')
    .replace(/\s/g, '')
    .trim();

  // If it has comma as decimal separator (e.g., 15.000,00)
  if (/\d+\.\d{3},\d{2}$/.test(clean)) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  // If it has period as thousand separator (e.g., 15.000)
  else if (/\d+\.\d{3}$/.test(clean)) {
    clean = clean.replace(/\./g, '');
  }
  // If it has comma as thousand separator (e.g., 15,000)
  else if (/\d+,\d{3}$/.test(clean)) {
    clean = clean.replace(/,/g, '');
  }

  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

// ── Date Parsing ──────────────────────────────────────────

function parseDate(text: string): string | null {
  // DD/MM/YYYY or DD-MM-YYYY
  const match1 = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match1) {
    const day = match1[1].padStart(2, '0');
    const month = match1[2].padStart(2, '0');
    let year = match1[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Indonesian month names: 17 Juni 2026
  const monthNames: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', ags: '08', agu: '08',
    sep: '09', okt: '10', nov: '11', des: '12',
  };

  const monthPattern = Object.keys(monthNames).join('|');
  const match2 = text.match(new RegExp(`(\\d{1,2})\\s*(${monthPattern})\\s*(\\d{2,4})`, 'i'));
  if (match2) {
    const day = match2[1].padStart(2, '0');
    const month = monthNames[match2[2].toLowerCase()];
    let year = match2[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  return null;
}

// ── Line Item Parsing ──────────────────────────────────────────

function parseLineItems(lines: string[]): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  let pendingName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 3) continue;

    // Skip garbage headers/footers
    if (/^(sub\s*total|total|kembalian|tunai|cash|debit|kredit|kartu|pajak|ppn|tax|diskon|no\.?\s*\d|tanggal|date|bayar|kembali|struk|nota)/i.test(line)) {
      pendingName = ''; // Reset
      continue;
    }

    // Try to find a price at the end of the line
    const priceMatch = line.match(/(\d[\d.,]*\d|\d)(?:\s*$)/);

    // If NO price is found on this line, it might be an item name for the NEXT line!
    if (!priceMatch) {
      // Must have some letters to be a valid name
      if ((line.match(/[a-zA-Z]/g) || []).length >= 2 && !/[/\\|\[\]{}<>:]/.test(line)) {
        pendingName = line;
      }
      continue;
    }

    // We found a price!
    const price = parsePrice(priceMatch[1]);
    if (price <= 0 || price > 100_000_000) {
      pendingName = '';
      continue;
    }

    // Try to extract qty (e.g., "2x", "2 x", "x2", "2 pcs")
    let qty = 1;
    const qtyMatch = line.match(/(\d+)\s*[xX×*]\s/);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1;
    }

    // Extract item name from the current line (everything before the price and qty)
    const inlineName = line
      .replace(/(\d[\d.,]*\d|\d)\s*$/, '')      // remove trailing price
      .replace(/(\d+)\s*[xX×*]\s/, '')            // remove qty prefix
      .replace(/[Rr][Pp]\.?\s*/g, '')             // remove Rp
      .replace(/[\d.,]+\s*$/, '')                 // remove another trailing number
      .trim();

    // Use the name from the previous line if the inline name is empty or just numbers
    let finalName = inlineName;
    if (inlineName.length < 3 || (inlineName.match(/[a-zA-Z]/g) || []).length < 2) {
      if (pendingName) {
        finalName = pendingName;
      }
    }

    // Still no valid name? Skip.
    if (finalName.length < 3 || (finalName.match(/[a-zA-Z]/g) || []).length < 2 || /[/\\|\[\]{}<>:]/.test(finalName)) {
      pendingName = '';
      continue;
    }

    items.push({
      name: { value: finalName, confidence: 0.7 },
      quantity: { value: qty, confidence: qtyMatch ? 0.8 : 0.5 },
      unit: { value: 'pcs', confidence: 0.5 },
      unit_price: { value: qty > 1 ? Math.round(price / qty) : price, confidence: 0.6 },
      subtotal: { value: price, confidence: 0.7 },
    });

    // Reset pending name after a successful match
    pendingName = '';
  }

  return items;
}

// ── Vendor Name Extraction ──────────────────────────────────────

function extractVendorName(lines: string[]): string {
  // Usually vendor name is in the first 3 non-empty lines
  for (let i = 0; i < Math.min(lines.length, 7); i++) {
    const line = lines[i].trim();
    if (line.length < 3) continue;
    // Skip lines that are just numbers, dates, or addresses
    if (/^\d+$/.test(line)) continue;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(line)) continue;
    if (/^(jl\.|jalan|alamat|telp|tel|hp|no\.|npwp)/i.test(line)) continue;
    if (/^-+$/.test(line)) continue;
    // Reject lines that are mostly symbols or garbage like "] 25)"
    if (!/^[a-zA-Z0-9\s.,'&]+$/.test(line)) continue;
    // Must contain at least two letters
    if ((line.match(/[a-zA-Z]/g) || []).length < 2) continue;
    
    return line;
  }
  return 'Tidak Teridentifikasi';
}

// ── Extract Text via Tesseract (Client Side) ────────────────────

export async function performOCR(imageBase64: string, mimeType: string): Promise<{ text: string; confidence: number }> {
  const Tesseract = (await import('tesseract.js')).default;
  const imageSrc = `data:${mimeType};base64,${imageBase64}`;

  const { data } = await Tesseract.recognize(imageSrc, 'ind+eng', {
    logger: m => console.log('OCR Progress:', m.status, Math.round(m.progress * 100) + '%')
  });

  return {
    text: data.text || '',
    confidence: (data.confidence || 50) / 100
  };
}

// ── Local Regex Parser ──────────────────────────────────────────

export function parseTextRegex(fullText: string, ocrConfidence: number): ReceiptResult {
  const lines = fullText.split('\n').filter((l: string) => l.trim().length > 0);

  if (lines.length === 0) {
    return createEmptyResult('Tidak dapat membaca teks dari gambar. Pastikan gambar struk jelas dan tidak buram.');
  }

  // Extract vendor name from top lines
  const vendorName = extractVendorName(lines);

  // Extract date
  let transactionDate: string | null = null;
  for (const line of lines) {
    transactionDate = parseDate(line);
    if (transactionDate) break;
  }
  if (!transactionDate) {
    transactionDate = new Date().toISOString().split('T')[0]; // Default today
  }

  // Extract items
  const items = parseLineItems(lines);

  // Extract total — look for "TOTAL" line
  let totalAmount = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (/^(grand\s*)?total/i.test(line) || /^total\s*(belanja|bayar|akhir)?/i.test(line)) {
      const priceMatch = line.match(/(\d[\d.,]*\d)/g);
      if (priceMatch) {
        totalAmount = parsePrice(priceMatch[priceMatch.length - 1]);
      }
      break;
    }
  }

  // If no total found, sum items
  if (totalAmount === 0 && items.length > 0) {
    totalAmount = items.reduce((sum, item) => sum + item.subtotal.value, 0);
  }

  return {
    vendor_name: { value: vendorName, confidence: ocrConfidence * 0.7 },
    transaction_date: { value: transactionDate, confidence: ocrConfidence * 0.8 },
    items: items.length > 0 ? items : [{
      name: { value: 'Item tidak teridentifikasi', confidence: 0.3 },
      quantity: { value: 1, confidence: 0.3 },
      unit: { value: 'pcs', confidence: 0.3 },
      unit_price: { value: totalAmount, confidence: 0.3 },
      subtotal: { value: totalAmount, confidence: 0.3 },
    }],
    total_amount: { value: totalAmount, confidence: ocrConfidence * 0.7 },
  };
}

// ── Main Entry Point with API Fallback ──────────────────────────

export async function extractReceiptWithOCR(imageBase64: string, mimeType: string): Promise<ReceiptResult> {
  try {
    // 1. Run Client-side OCR to extract raw text
    const { text, confidence } = await performOCR(imageBase64, mimeType);
    
    if (!text.trim()) {
      return createEmptyResult('Tidak ada teks yang terdeteksi pada gambar struk.');
    }

    // 2. Try to send raw text to our Server/Groq parser API
    try {
      const response = await fetch('/api/scanner/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          console.log('[Receipt Scanner] Successfully parsed via Groq LLM API');
          return result.data;
        }
      }
      console.warn('[Receipt Scanner] API call not successful, falling back to local regex parser');
    } catch (apiErr) {
      const message = apiErr instanceof Error ? apiErr.message : String(apiErr);
      console.warn('[Receipt Scanner] Remote parser failed, falling back to local regex:', message);
    }

    // 3. Fallback to local regex parser
    return parseTextRegex(text, confidence);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('OCR main thread error:', message);
    return createEmptyResult('Gagal memproses gambar. Coba foto ulang dengan pencahayaan yang lebih baik.');
  }
}

function createEmptyResult(errorMsg: string): ReceiptResult {
  return {
    vendor_name: { value: errorMsg, confidence: 0.0 },
    transaction_date: { value: new Date().toISOString().split('T')[0], confidence: 0.0 },
    items: [
      {
        name: { value: 'Tidak ada item terdeteksi', confidence: 0.0 },
        quantity: { value: 0, confidence: 0.0 },
        unit: { value: '-', confidence: 0.0 },
        unit_price: { value: 0, confidence: 0.0 },
        subtotal: { value: 0, confidence: 0.0 },
      },
    ],
    total_amount: { value: 0, confidence: 0.0 },
  };
}
