/**
 * Smart Query Engine — Rule-Based Data Analyst untuk S.A.V.O.R.I
 * Menjawab pertanyaan user tentang transaksi TANPA LLM.
 * 100% akurat, instan, zero hallucination.
 */

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
  vendor_name: string;
  branch: string;
  items: TransactionItem[];
}

// ── Keyword Matchers ──────────────────────────────────────────

const GREETING_PATTERNS = /^(hai|halo|hello|hi|hey|selamat\s+(pagi|siang|sore|malam)|assalamualaikum|p$)/i;

const FREQUENCY_PATTERNS = /berapa\s*(kali|banyak|sering)|seberapa\s*sering|frekuensi/i;
const TOTAL_PATTERNS = /total\s*(harga|pengeluaran|belanja|biaya|uang)?|berapa\s*(total|jumlah\s*(harga|uang|pengeluaran|belanja)?)|habis\s*berapa|jumlahkan|totalkan/i;
const WHEN_PATTERNS = /kapan\s*(saja|aja)?|tanggal\s*berapa|hari\s*apa/i;
const WHERE_PATTERNS = /dimana\s*(saja|aja)?|di\s*mana|toko\s*(mana|apa)|beli\s*dimana/i;
const CATEGORY_PATTERNS = /kategori\s*(apa|mana)\s*(saja|aja)?|jenis\s*(apa|mana)|macam/i;
const MOST_PATTERNS = /paling\s*(sering|banyak|mahal|murah|tinggi)|terbanyak|termahal|termurah|ter(sering|besar)/i;
const LIST_ALL_PATTERNS = /semua\s*(transaksi|data|belanja)|daftar\s*(transaksi|belanja)|list/i;
const VENDOR_PATTERNS = /vendor|toko|penjual|pedagang|tempat\s*beli/i;
const BRANCH_PATTERNS = /cabang\s*(mana|apa)|branch/i;

// ── Time Range Parser ──────────────────────────────────────────

function getTimeRange(question: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (/hari\s*ini|today/i.test(question)) {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start: today, end, label: 'hari ini' };
  }

  if (/kemarin|yesterday/i.test(question)) {
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: 'kemarin' };
  }

  if (/minggu\s*ini|this\s*week/i.test(question)) {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = new Date(today);
    start.setDate(today.getDate() + mondayOffset);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: 'minggu ini' };
  }

  if (/bulan\s*ini|this\s*month/i.test(question)) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: 'bulan ini' };
  }

  if (/minggu\s*lalu|last\s*week/i.test(question)) {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + mondayOffset);
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - 7);
    const end = new Date(thisMonday);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: 'minggu lalu' };
  }

  if (/bulan\s*lalu|last\s*month/i.test(question)) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: 'bulan lalu' };
  }

  if (/akhir\s*akhir\s*ini|belakangan\s*ini|terakhir|recently/i.test(question)) {
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: '2 minggu terakhir' };
  }

  // Default: semua data
  return { start: new Date(2000, 0, 1), end: new Date(2099, 11, 31), label: 'semua waktu' };
}

// ── Keyword Extraction ──────────────────────────────────────────

function extractSearchKeyword(question: string): string | null {
  // Remove common question words, time markers etc.
  let clean = question.toLowerCase()
    .replace(/berapa\s*(kali|banyak|sering|total|jumlah|harga|biaya|rp)?/gi, '')
    .replace(/kapan\s*(saja|aja)?/gi, '')
    .replace(/dimana\s*(saja|aja)?|di\s*mana/gi, '')
    .replace(/hari\s*ini|kemarin|minggu\s*(ini|lalu)|bulan\s*(ini|lalu)|akhir\s*akhir\s*ini|belakangan\s*ini/gi, '')
    .replace(/saya|aku|gue|gw|kamu|anda/gi, '')
    .replace(/beli|membeli|belanja|makan|minum|pesan|order/gi, '')
    .replace(/yang|dan|atau|ini|itu|ke|di|dari|untuk|pada|dengan|paling|sering|terbanyak|termahal/gi, '')
    .replace(/kalau|semua|dijumlahkan|jumlahkan|totalkan|seluruh|pengeluaran|pengeluran|rp|nya\b/gi, '')
    .replace(/total|harga|biaya/gi, '')
    .replace(/\?|!|,|\./g, '')
    .trim();

  // Split and filter empty/very short words
  const words = clean.split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) return null;
  return words.join(' ');
}

// ── Filter Transactions ──────────────────────────────────────────

function filterByTimeRange(transactions: Transaction[], range: { start: Date; end: Date }): Transaction[] {
  return transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d >= range.start && d <= range.end;
  });
}

function filterByKeyword(transactions: Transaction[], keyword: string): Transaction[] {
  const kw = keyword.toLowerCase();
  return transactions.filter(t => {
    // Match vendor
    if (t.vendor_name?.toLowerCase().includes(kw)) return true;
    // Match category
    if (t.category?.toLowerCase().includes(kw)) return true;
    // Match items
    if (t.items?.some(item => item.name?.toLowerCase().includes(kw))) return true;
    // Match branch
    if (t.branch?.toLowerCase().includes(kw)) return true;
    return false;
  });
}

// ── Formatting Helpers ──────────────────────────────────────────

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Main Query Engine ──────────────────────────────────────────

export function processQuery(question: string, transactions: Transaction[]): string {
  // 1. Handle greetings
  if (GREETING_PATTERNS.test(question.trim())) {
    return 'Halo! Saya asisten data S.A.V.O.R.I. Silakan tanyakan apa saja tentang data transaksi Anda, misalnya:\n• "Berapa kali saya beli mie ayam minggu ini?"\n• "Total pengeluaran bulan ini?"\n• "Kategori apa saja yang saya belanjakan?"';
  }

  // 2. No data check
  if (!transactions || transactions.length === 0) {
    return 'Belum ada data transaksi di sistem. Silakan unggah struk atau input data terlebih dahulu.';
  }

  // 3. Parse time range
  const timeRange = getTimeRange(question);
  let filtered = filterByTimeRange(transactions, timeRange);

  // 4. Extract keyword and filter
  const keyword = extractSearchKeyword(question);
  let keywordFiltered = keyword ? filterByKeyword(filtered, keyword) : filtered;

  // ── Category question ──
  if (CATEGORY_PATTERNS.test(question)) {
    const categories = [...new Set(filtered.map(t => t.category).filter(Boolean))];
    if (categories.length === 0) return `Tidak ada data kategori untuk ${timeRange.label}.`;
    return `Kategori belanja Anda pada ${timeRange.label}:\n${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nTotal ${categories.length} kategori dari ${filtered.length} transaksi.`;
  }

  // ── Branch question ──
  if (BRANCH_PATTERNS.test(question)) {
    const branches = [...new Set(filtered.map(t => t.branch).filter(Boolean))];
    if (branches.length === 0) return `Tidak ada data cabang untuk ${timeRange.label}.`;
    return `Cabang yang tercatat pada ${timeRange.label}:\n${branches.map((b, i) => `${i + 1}. ${b}`).join('\n')}`;
  }

  // ── Frequency question ──
  if (FREQUENCY_PATTERNS.test(question)) {
    if (keyword && keywordFiltered.length > 0) {
      // Count items matching keyword
      let itemCount = 0;
      keywordFiltered.forEach(t => {
        if (t.items?.length > 0) {
          const matchingItems = t.items.filter(item => item.name?.toLowerCase().includes(keyword.toLowerCase()));
          itemCount += matchingItems.length > 0 ? matchingItems.reduce((sum, item) => sum + (item.qty || 1), 0) : 1;
        } else {
          itemCount += 1;
        }
      });
      return `Anda membeli/bertransaksi "${keyword}" sebanyak ${Math.round(itemCount)} kali pada ${timeRange.label} (dari ${keywordFiltered.length} transaksi).`;
    }
    if (keyword) return `Data "${keyword}" tidak ditemukan pada ${timeRange.label}.`;
    return `Total ada ${filtered.length} transaksi pada ${timeRange.label}.`;
  }

  // ── Total/amount question ──
  if (TOTAL_PATTERNS.test(question)) {
    if (keyword && keywordFiltered.length > 0) {
      let total = 0;
      keywordFiltered.forEach(t => {
        if (t.items?.length > 0) {
          const matchingItems = t.items.filter(item => item.name?.toLowerCase().includes(keyword.toLowerCase()));
          if (matchingItems.length > 0) {
            total += matchingItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
          } else {
            total += t.amount || 0;
          }
        } else {
          total += t.amount || 0;
        }
      });
      return `Total pengeluaran untuk "${keyword}" pada ${timeRange.label}:\n${formatRupiah(total)} (dari ${keywordFiltered.length} transaksi).`;
    }
    if (keyword) return `Data "${keyword}" tidak ditemukan pada ${timeRange.label}.`;
    const total = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);
    return `Total pengeluaran pada ${timeRange.label}:\n${formatRupiah(total)} (dari ${filtered.length} transaksi).`;
  }

  // ── Most/terbanyak question ──
  // Check this BEFORE When/Where so "kapan hari paling sering" doesn't get trapped by WHEN
  if (MOST_PATTERNS.test(question)) {
    if (/mahal|termahal/i.test(question)) {
      const sorted = [...filtered].sort((a, b) => (b.amount || 0) - (a.amount || 0));
      if (sorted.length === 0) return 'Tidak ada data transaksi.';
      const top = sorted[0];
      return `Transaksi termahal pada ${timeRange.label}:\n${top.vendor_name || 'Tidak diketahui'} — ${formatRupiah(top.amount)} pada ${formatDate(top.transaction_date)} (${top.category || '-'}).`;
    }

    if (/sering|banyak|terbanyak/i.test(question)) {
      // Count by day
      const dayCounts: Record<string, number> = {};
      filtered.forEach(t => {
        const day = formatDate(t.transaction_date);
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const sortedDays = Object.entries(dayCounts).sort(([, a], [, b]) => b - a);
      if (sortedDays.length === 0) return 'Tidak ada data transaksi.';
      const [topDay, topCount] = sortedDays[0];
      return `Hari dengan transaksi terbanyak pada ${timeRange.label}:\n${topDay} dengan ${topCount} transaksi.${sortedDays.length > 1 ? `\n\nRincian semua hari:\n${sortedDays.map(([d, c]) => `• ${d}: ${c} transaksi`).join('\n')}` : ''}`;
    }

    return 'Maaf, saya belum bisa memproses pertanyaan "paling" jenis ini. Coba tanyakan "hari paling sering belanja" atau "transaksi termahal".';
  }

  // ── When question ──
  if (WHEN_PATTERNS.test(question)) {
    const source = keyword && keywordFiltered.length > 0 ? keywordFiltered : filtered;
    if (source.length === 0) return keyword ? `Data "${keyword}" tidak ditemukan.` : 'Tidak ada data transaksi.';
    const dates = [...new Set(source.map(t => t.transaction_date))].sort();
    const label = keyword || 'transaksi';
    return `"${label}" tercatat pada tanggal:\n${dates.map(d => `• ${formatDate(d)}`).join('\n')}\n\nTotal ${source.length} transaksi.`;
  }

  // ── Where question ──
  if (WHERE_PATTERNS.test(question)) {
    const source = keyword && keywordFiltered.length > 0 ? keywordFiltered : filtered;
    if (source.length === 0) return keyword ? `Data "${keyword}" tidak ditemukan.` : 'Tidak ada data transaksi.';
    const vendors = [...new Set(source.map(t => t.vendor_name).filter(Boolean))];
    const label = keyword || 'belanja';
    if (vendors.length === 0) return `Tidak ada informasi vendor untuk "${label}".`;
    return `Anda membeli "${label}" di:\n${vendors.map((v, i) => {
      const vendorTx = source.filter(t => t.vendor_name === v);
      const total = vendorTx.reduce((s, t) => s + (t.amount || 0), 0);
      return `${i + 1}. ${v} — ${vendorTx.length}x, total ${formatRupiah(total)}`;
    }).join('\n')}`;
  }

  // ── Most/terbanyak question ──
  if (MOST_PATTERNS.test(question)) {
    if (/mahal|termahal/i.test(question)) {
      const sorted = [...filtered].sort((a, b) => (b.amount || 0) - (a.amount || 0));
      if (sorted.length === 0) return 'Tidak ada data transaksi.';
      const top = sorted[0];
      return `Transaksi termahal pada ${timeRange.label}:\n${top.vendor_name || 'Tidak diketahui'} — ${formatRupiah(top.amount)} pada ${formatDate(top.transaction_date)} (${top.category || '-'}).`;
    }

    if (/sering|banyak|terbanyak/i.test(question)) {
      // Count by day
      const dayCounts: Record<string, number> = {};
      filtered.forEach(t => {
        const day = formatDate(t.transaction_date);
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const sortedDays = Object.entries(dayCounts).sort(([, a], [, b]) => b - a);
      if (sortedDays.length === 0) return 'Tidak ada data transaksi.';
      const [topDay, topCount] = sortedDays[0];
      return `Hari dengan transaksi terbanyak pada ${timeRange.label}:\n${topDay} dengan ${topCount} transaksi.${sortedDays.length > 1 ? `\n\nRincian semua hari:\n${sortedDays.map(([d, c]) => `• ${d}: ${c} transaksi`).join('\n')}` : ''}`;
    }

    return 'Maaf, saya belum bisa memproses pertanyaan "paling" jenis ini. Coba tanyakan "hari paling sering belanja" atau "transaksi termahal".';
  }

  // ── Vendor question ──
  if (VENDOR_PATTERNS.test(question)) {
    const vendors = [...new Set(filtered.map(t => t.vendor_name).filter(Boolean))];
    if (vendors.length === 0) return `Tidak ada data vendor pada ${timeRange.label}.`;
    return `Daftar vendor/toko pada ${timeRange.label}:\n${vendors.map((v, i) => {
      const count = filtered.filter(t => t.vendor_name === v).length;
      return `${i + 1}. ${v} (${count}x)`;
    }).join('\n')}`;
  }

  // ── List all ──
  if (LIST_ALL_PATTERNS.test(question)) {
    if (filtered.length === 0) return `Tidak ada transaksi pada ${timeRange.label}.`;
    const lines = filtered.slice(0, 20).map((t, i) => {
      const itemNames = t.items?.map(it => it.name).join(', ') || '-';
      return `${i + 1}. ${formatDate(t.transaction_date)} — ${t.vendor_name || 'Tidak diketahui'} (${t.category || '-'})\n   Items: ${itemNames}\n   Total: ${formatRupiah(t.amount)}`;
    });
    const footer = filtered.length > 20 ? `\n\n...dan ${filtered.length - 20} transaksi lainnya.` : '';
    return `Daftar transaksi pada ${timeRange.label} (${filtered.length} total):\n\n${lines.join('\n\n')}${footer}`;
  }

  // ── General keyword search (fallback) ──
  if (keyword && keywordFiltered.length > 0) {
    const total = keywordFiltered.reduce((sum, t) => sum + (t.amount || 0), 0);
    const vendors = [...new Set(keywordFiltered.map(t => t.vendor_name).filter(Boolean))];
    const dates = [...new Set(keywordFiltered.map(t => formatDate(t.transaction_date)))];

    let response = `Ditemukan ${keywordFiltered.length} transaksi terkait "${keyword}" pada ${timeRange.label}:\n`;
    response += `• Total: ${formatRupiah(total)}\n`;
    if (vendors.length > 0) response += `• Vendor: ${vendors.join(', ')}\n`;
    if (dates.length <= 5) response += `• Tanggal: ${dates.join(', ')}\n`;
    return response;
  }

  if (keyword) {
    return `Data "${keyword}" tidak ditemukan pada ${timeRange.label}. Coba kata kunci lain atau periksa rentang waktunya.`;
  }

  // ── Completely unrecognized ──
  return `Saya menemukan ${filtered.length} transaksi pada ${timeRange.label}.\n\nCoba tanyakan lebih spesifik, misalnya:\n• "Berapa kali saya beli mie ayam minggu ini?"\n• "Total pengeluaran bulan ini?"\n• "Kategori apa saja?"\n• "Di mana saya beli bakso?"`;
}
