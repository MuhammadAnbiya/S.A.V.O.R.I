import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
    console.error('Gemini extraction error (Falling back to mock data):', error.message || error);
    // Fallback mock data as per user rules
    return {
      vendor_name: { value: "Mock Vendor (API Error)", confidence: 0.5 },
      transaction_date: { value: new Date().toISOString().split('T')[0], confidence: 0.5 },
      items: [
        {
          name: { value: "Item 1 (Mock)", confidence: 0.5 },
          quantity: { value: 1, confidence: 0.5 },
          unit: { value: "pcs", confidence: 0.5 },
          unit_price: { value: 15000, confidence: 0.5 },
          subtotal: { value: 15000, confidence: 0.5 }
        }
      ],
      total_amount: { value: 15000, confidence: 0.5 }
    };
  }
}