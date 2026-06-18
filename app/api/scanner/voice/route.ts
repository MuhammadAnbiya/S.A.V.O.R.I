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
2. "total_amount": Total uang dalam bentuk angka (number).
3. "type": "income" (pemasukan) atau "expense" (pengeluaran).
4. "category": Pilih SALAH SATU dari kategori berikut: "Operasional", "Peralatan", "Bahan Baku", "Transportasi". Jika tidak pasti, pilih "Operasional".
5. "items": array berisi barang, format [{"name": "nama barang", "qty": angka jumlah barang, "price": angka harga satuan}]. Wajib mendeteksi jumlah barang (qty) dari ucapan!
   - Jika pengguna menyebut barang tapi tidak merinci harganya, coba bagi rata atau jika hanya ada 1 barang (misal: "makan siang abis 100 ribu"), masukkan "makan siang" dengan qty 1 dan price 100000. Jangan taruh angka 0 jika memungkinkan.
7. "payment_method": Metode pembayaran jika disebutkan (misal: "Cash", "QRIS", "DANA", "GoPay", "Transfer Bank"). Jika tidak disebutkan, kembalikan "Cash".
8. "notes": Isi HANYA JIKA pengguna secara spesifik menyuruh "tambahkan catatan...", "di note...", atau menyebut konteks yang sangat penting selain transaksi. Jangan masukkan ulang seluruh ucapan. Jika tidak ada instruksi khusus, kosongkan "".

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
      items: (data.items || []).map((i: any) => ({
        name: { value: i.name || 'Item Transaksi', confidence: 0.95 },
        quantity: { value: Number(i.qty) || 1, confidence: 0.95 },
        unit: { value: 'pcs', confidence: 0.95 },
        unit_price: { value: Number(i.price) || 0, confidence: 0.95 },
        subtotal: { value: (Number(i.qty) || 1) * (Number(i.price) || 0), confidence: 0.95 }
      })),
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
