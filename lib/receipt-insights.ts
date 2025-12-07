import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface ReceiptInsights {
  monthlySpending: number
  topMerchants: Array<{ name: string; count: number; total: number }>
  categoryBreakdown: Record<string, number>
  trends: string
  suggestions: string[]
  predictedNextMonth: number
}

/**
 * Generate smart insights from receipt history using Gemini
 */
export async function generateReceiptInsights(
  receipts: Array<{
    merchant: string
    total: number
    date: Date
    category: { name: string } | null
  }>
): Promise<ReceiptInsights> {
  if (!process.env.GEMINI_API_KEY || receipts.length === 0) {
    return {
      monthlySpending: 0,
      topMerchants: [],
      categoryBreakdown: {},
      trends: 'No data available',
      suggestions: [],
      predictedNextMonth: 0,
    }
  }

  // Calculate current month spending
  const now = new Date()
  const currentMonthReceipts = receipts.filter(
    r => r.date.getMonth() === now.getMonth() && r.date.getFullYear() === now.getFullYear()
  )
  const monthlySpending = currentMonthReceipts.reduce((sum, r) => sum + r.total, 0)
  
  // Group by merchant
  const merchantMap = new Map<string, { count: number; total: number }>()
  receipts.forEach(r => {
    const existing = merchantMap.get(r.merchant) || { count: 0, total: 0 }
    merchantMap.set(r.merchant, {
      count: existing.count + 1,
      total: existing.total + r.total,
    })
  })
  
  const topMerchants = Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  
  // Group by category
  const categoryMap = new Map<string, number>()
  receipts.forEach(r => {
    const catName = r.category?.name || 'Uncategorized'
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + r.total)
  })
  const categoryBreakdown = Object.fromEntries(categoryMap)

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Create summary for AI
    const receiptSummary = receipts
      .slice(-20) // Last 20 receipts
      .map(r => 
        `${r.date.toLocaleDateString()}: ${r.merchant} - $${r.total} (${r.category?.name || 'Uncategorized'})`
      ).join('\n')
    
    const prompt = `Analyze these expense receipts and provide insights:

Recent Receipts:
${receiptSummary}

Current Month Total: $${monthlySpending.toFixed(2)}

Provide insights in JSON format:
{
  "trends": "brief description of spending trends (2-3 sentences)",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "predictedNextMonth": number (predicted spending for next month based on trends)
}

Be helpful and actionable. Focus on saving money and better expense management.`

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonText = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return {
        monthlySpending,
        topMerchants,
        categoryBreakdown,
        trends: data.trends || 'No significant trends detected',
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        predictedNextMonth: parseFloat(data.predictedNextMonth) || monthlySpending,
      }
    }

    return {
      monthlySpending,
      topMerchants,
      categoryBreakdown,
      trends: 'Unable to analyze trends',
      suggestions: [],
      predictedNextMonth: monthlySpending,
    }
  } catch (error) {
    console.error('Insights generation error:', error)
    return {
      monthlySpending,
      topMerchants,
      categoryBreakdown,
      trends: 'Error generating insights',
      suggestions: [],
      predictedNextMonth: monthlySpending,
    }
  }
}

