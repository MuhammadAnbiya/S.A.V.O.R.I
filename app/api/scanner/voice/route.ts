import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 30; // maximum 30 seconds

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { status: 'error', error: { message: 'Audio file is required.' } },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey.trim() === '') {
      return NextResponse.json(
        { status: 'error', error: { message: 'GROQ_API_KEY is not configured.' } },
        { status: 500 }
      );
    }

    // Initialize Groq client
    const groq = new OpenAI({
      apiKey: groqKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    // 1. Transcribe audio to text using Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'text',
      language: 'id', // Force Indonesian/Mixed language understanding
    });

    const transcriptText = transcription as unknown as string;
    
    if (!transcriptText || transcriptText.trim() === '') {
       return NextResponse.json(
        { status: 'error', error: { message: 'Suara tidak terdengar jelas. Coba ulangi lagi.' } },
        { status: 400 }
      );
    }

    // 2. Extract JSON using Llama 3 70B
    const prompt = `Anda adalah asisten keuangan pintar berbahasa Indonesia.
Tugas Anda adalah mengekstrak data transaksi dari teks ucapan (Voice to Text) berikut ini menjadi format JSON.

Teks Ucapan:
"${transcriptText}"

Panduan:
1. "vendor_name": Nama toko, tempat, atau orang (string).
2. "total_amount": Total uang dalam bentuk angka (number). WAJIB konversi kata "ribu" atau "juta" menjadi angka nol (misal: "16 ribu" -> 16000, "1 setengah juta" -> 1500000). Jangan pernah menaruh "16" jika maksudnya 16 ribu!
3. "type": "income" (pemasukan) atau "expense" (pengeluaran).
4. "category": Pilih SALAH SATU dari: "Operasional", "Peralatan", "Bahan Baku", "Transportasi". Jika ragu, "Operasional".
5. "items": array berisi barang, format [{"name": "nama barang", "qty": angka jumlah barang, "price": angka harga satuan, "subtotal": angka total akhir untuk item ini}]. Wajib mendeteksi jumlah barang (qty)!
   - Jika pengguna menyebut barang tapi tidak merinci harganya, bagi rata.
   - PENTING UNTUK DISKON/PAJAK: Jika pengguna menyebut diskon atau total akhir yang berbeda dari (qty * price), hitung matematis dan masukkan hasil akhir ke "subtotal". (Ingat: Konversi "ribu" ke 000).
7. "payment_method": DENGARKAN BAIK-BAIK METODE PEMBAYARANNYA (misal: "QRIS", "Transfer Bank", "BCA", "DANA", "Cash"). Jika disebutkan QRIS/Dana/Bank, WAJIB tulis itu. HANYA tulis "Cash" jika benar-benar tidak ada indikasi apapun.
8. "notes": Ekstrak instruksi tambahan atau alasan pembelian (misal: "harus beli lagi 2 lusin besok", "buat stok gudang"). Tulis intinya saja dengan sangat ringkas. Jika tidak ada pesan tambahan, WAJIB isi dengan string kosong "".

Pastikan output HANYA berupa JSON tanpa markdown \`\`\`json, tanpa penjelasan apapun. Valid JSON object.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const jsonString = completion.choices[0]?.message?.content || '{}';
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      data = { vendor_name: 'Gagal parse JSON', total_amount: 0, items: [] };
    }

    // Adapt to our UI structure
    const result = {
      vendor_name: { value: data.vendor_name || 'Tidak diketahui', confidence: 0.95 },
      transaction_date: { value: new Date().toISOString().split('T')[0], confidence: 0.99 },
      total_amount: { value: data.total_amount || 0, confidence: 0.95 },
      items: (data.items || []).map((i: any) => {
        const qty = Number(i.qty) || 1;
        const price = Number(i.price) || 0;
        const subtotal = i.subtotal !== undefined && i.subtotal !== null ? Number(i.subtotal) : qty * price;
        return {
          name: { value: i.name || 'Item Transaksi', confidence: 0.95 },
          quantity: { value: qty, confidence: 0.95 },
          unit: { value: 'pcs', confidence: 0.95 },
          unit_price: { value: price, confidence: 0.95 },
          subtotal: { value: subtotal, confidence: 0.95 }
        };
      }),
      notes: data.notes || '',
      type: data.type || 'expense',
      category: data.category || 'Operasional',
      branch: 'Pusat',
      payment_method: data.payment_method || 'Cash',
    };

    return NextResponse.json({
      status: 'success',
      data: result
    });

  } catch (error: any) {
    console.error('[Voice Scanner] Error:', error);
    return NextResponse.json(
      { status: 'error', error: { message: error.message || 'Gagal memproses suara.' } },
      { status: 500 }
    );
  }
}
