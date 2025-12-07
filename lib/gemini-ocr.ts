import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface ExtractedReceiptData {
  merchant: string
  date: Date | null
  total: number
  tax: number
  subtotal: number | null
  items: Array<{ name: string; price: number; quantity: number }>
  paymentMethod: string | null
  rawText: string
}

/**
 * Extract receipt data using Google Gemini Vision API
 * This is faster and more accurate than traditional OCR
 */
export async function extractReceiptWithGemini(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedReceiptData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `Extract receipt data from this image. Return ONLY valid JSON, no other text:
{
  "merchant": "store or business name",
  "date": "YYYY-MM-DD format",
  "total": number (total amount),
  "tax": number (tax amount, 0 if not found),
  "subtotal": number or null,
  "items": [{"name": "item name", "price": number, "quantity": number}],
  "paymentMethod": "cash|credit|debit|other" or null,
  "rawText": "all text extracted from receipt"
}

Be precise with numbers. If date is not found, use today's date. If total is not found, use 0.`

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response.text()
    
    // Extract JSON from response (handle cases where there's extra text)
    let jsonText = response.trim()
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const data = JSON.parse(jsonMatch[0])
    
    // Parse date
    let date: Date | null = null
    if (data.date) {
      date = new Date(data.date)
      if (isNaN(date.getTime())) {
        date = new Date()
      }
    } else {
      date = new Date()
    }
    
    return {
      merchant: data.merchant || 'Unknown',
      date,
      total: parseFloat(data.total) || 0,
      tax: parseFloat(data.tax) || 0,
      subtotal: data.subtotal ? parseFloat(data.subtotal) : null,
      items: Array.isArray(data.items) ? data.items.map((item: any) => ({
        name: item.name || '',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
      })) : [],
      paymentMethod: data.paymentMethod || null,
      rawText: data.rawText || response,
    }
  } catch (error) {
    console.error('Gemini OCR Error:', error)
    throw new Error(`Failed to extract receipt data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

