import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface DuplicateCheckResult {
  isDuplicate: boolean
  matchId?: string
  confidence: number
  reason?: string
}

/**
 * Detect duplicate receipts using Gemini Vision
 * Compares new receipt with existing ones
 */
export async function detectDuplicateReceipt(
  newReceiptImage: Buffer,
  newReceiptData: {
    merchant: string
    date: Date
    total: number
  },
  existingReceipts: Array<{
    id: string
    merchant: string
    date: Date
    total: number
    imageUrl?: string
  }>
): Promise<DuplicateCheckResult> {
  if (!process.env.GEMINI_API_KEY || existingReceipts.length === 0) {
    return { isDuplicate: false, confidence: 0 }
  }

  try {
    // First, quick check by merchant, date, and total
    const quickMatch = existingReceipts.find(
      r => r.merchant.toLowerCase() === newReceiptData.merchant.toLowerCase() &&
           Math.abs(r.total - newReceiptData.total) < 0.01 &&
           Math.abs(r.date.getTime() - newReceiptData.date.getTime()) < 24 * 60 * 60 * 1000 // Same day
    )

    if (quickMatch) {
      return {
        isDuplicate: true,
        matchId: quickMatch.id,
        confidence: 0.9,
        reason: 'Same merchant, date, and total amount',
      }
    }

    // If no quick match, use Gemini to compare images (for similar receipts)
    // Limit to recent receipts to save API calls
    const recentReceipts = existingReceipts
      .filter(r => Math.abs(r.date.getTime() - newReceiptData.date.getTime()) < 7 * 24 * 60 * 60 * 1000)
      .slice(0, 5) // Only check last 5 receipts

    if (recentReceipts.length === 0) {
      return { isDuplicate: false, confidence: 0 }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const receiptsList = recentReceipts.map(r => 
      `ID: ${r.id}, ${r.merchant}, ${r.date.toLocaleDateString()}, $${r.total}`
    ).join('\n')

    const prompt = `Compare this new receipt with these existing receipts:

New Receipt:
- Merchant: ${newReceiptData.merchant}
- Date: ${newReceiptData.date.toLocaleDateString()}
- Total: $${newReceiptData.total}

Existing Receipts:
${receiptsList}

Is this new receipt a duplicate of any existing receipt? Consider:
- Same merchant
- Same date (or very close)
- Same total amount
- Similar items

Return JSON only:
{
  "isDuplicate": boolean,
  "matchId": "receipt ID if duplicate, or null",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`

    const imagePart = {
      inlineData: {
        data: newReceiptImage.toString('base64'),
        mimeType: 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response.text()
    
    const jsonText = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return {
        isDuplicate: data.isDuplicate || false,
        matchId: data.matchId || undefined,
        confidence: data.confidence || 0.5,
        reason: data.reason,
      }
    }

    return { isDuplicate: false, confidence: 0 }
  } catch (error) {
    console.error('Duplicate detection error:', error)
    return { isDuplicate: false, confidence: 0 }
  }
}

