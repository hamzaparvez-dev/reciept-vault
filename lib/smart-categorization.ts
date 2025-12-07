import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface CategorySuggestion {
  categoryId: string
  categoryName: string
  confidence: number
  irsCategory: string | null
}

// IRS tax categories
export const IRS_CATEGORIES = {
  MEALS: 'Meals & Entertainment',
  TRAVEL: 'Travel',
  OFFICE: 'Office Supplies',
  VEHICLE: 'Vehicle Expenses',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  PROFESSIONAL: 'Professional Services',
  SOFTWARE: 'Software & Subscriptions',
  MARKETING: 'Marketing & Advertising',
  INSURANCE: 'Insurance',
  OTHER: 'Other Business Expenses',
} as const

/**
 * Smart categorization using Gemini AI
 * Much more accurate than keyword matching
 */
export async function smartCategorizeReceipt(
  merchant: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  total: number,
  date: Date,
  existingCategories: Array<{ id: string; name: string; irsCategory: string | null }>
): Promise<CategorySuggestion | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const categoryList = existingCategories.map(cat => 
      `- ${cat.name}${cat.irsCategory ? ` (${cat.irsCategory})` : ''}`
    ).join('\n')
    
    const itemsList = items.map(item => `${item.name} - $${item.price}`).join('\n')
    
    const prompt = `Categorize this receipt for business expense tracking:

Merchant: ${merchant}
Date: ${date.toLocaleDateString()}
Total: $${total}
Items:
${itemsList || 'No items listed'}

Available categories:
${categoryList || 'None - suggest a new category'}

IRS Categories: Meals & Entertainment, Travel, Office Supplies, Vehicle Expenses, Utilities, Rent, Professional Services, Software & Subscriptions, Marketing & Advertising, Insurance, Other Business Expenses

Return JSON only:
{
  "categoryName": "exact name from available categories or new category name",
  "irsCategory": "IRS category name",
  "confidence": 0.0-1.0,
  "isNewCategory": boolean
}

If no good match, suggest a new category with appropriate IRS category.`

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    // Extract JSON
    let jsonText = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return null
    }
    
    const data = JSON.parse(jsonMatch[0])
    
    // Find matching existing category
    const matchingCategory = existingCategories.find(
      cat => cat.name.toLowerCase() === data.categoryName.toLowerCase() ||
             cat.irsCategory === data.irsCategory
    )
    
    if (matchingCategory && !data.isNewCategory) {
      return {
        categoryId: matchingCategory.id,
        categoryName: matchingCategory.name,
        confidence: data.confidence || 0.8,
        irsCategory: matchingCategory.irsCategory,
      }
    }
    
    // Return suggestion for new category
    return {
      categoryId: '',
      categoryName: data.categoryName || 'Other',
      confidence: data.confidence || 0.7,
      irsCategory: data.irsCategory || IRS_CATEGORIES.OTHER,
    }
  } catch (error) {
    console.error('Smart categorization error:', error)
    return null
  }
}

