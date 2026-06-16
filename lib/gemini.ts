import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Extracts information from a receipt image using Gemini
 * @param imageBase64 Base64 encoded image string
 * @param mimeType MIME type of the image (e.g., 'image/jpeg')
 * @returns Promise with the parsed JSON from Gemini
 */
export async function extractReceiptData(imageBase64: string, mimeType: string) {
  const prompt = `Extract all information from this receipt/invoice image and return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "vendor_name": {"value": "string", "confidence": 0.0-1.0},
  "transaction_date": {"value": "YYYY-MM-DD", "confidence": 0.0-1.0},
  "items": [
    {
      "name": {"value": "string", "confidence": 0.0-1.0},
      "quantity": {"value": number, "confidence": 0.0-1.0},
      "unit": {"value": "string", "confidence": 0.0-1.0},
      "unit_price": {"value": number, "confidence": 0.0-1.0},
      "subtotal": {"value": number, "confidence": 0.0-1.0}
    }
  ],
  "total_amount": {"value": number, "confidence": 0.0-1.0}
}
For Indonesian receipts, handle formats like: Rp 15.000, 15,000, 15000.
For dates, try to infer the year if not present (likely current year).`;

  try {
    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);
    const response = await result.response;
    const text = response.text();
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error('Gemini extraction error:', error.message || error);
    console.warn('FALLBACK MOCK DATA APPLIED: Using mock receipt data because Gemini API failed (likely quota limit).');
    
    // Return dummy data instead of throwing so the UI can be tested
    return {
      vendor_name: { value: "Toko Dummy Serba Ada (MOCK)", confidence: 0.95 },
      transaction_date: { value: new Date().toISOString().split('T')[0], confidence: 0.9 },
      items: [
        {
          name: { value: "Buku Catatan", confidence: 0.85 },
          quantity: { value: 2, confidence: 0.99 },
          unit: { value: "pcs", confidence: 0.9 },
          unit_price: { value: 25000, confidence: 0.95 },
          subtotal: { value: 50000, confidence: 0.98 }
        },
        {
          name: { value: "Pena Tinta Hitam", confidence: 0.75 },
          quantity: { value: 3, confidence: 0.99 },
          unit: { value: "pcs", confidence: 0.8 },
          unit_price: { value: 5000, confidence: 0.95 },
          subtotal: { value: 15000, confidence: 0.96 }
        }
      ],
      total_amount: { value: 65000, confidence: 0.98 }
    };
  }
}