// ML-based categorization system for receipts

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

// Category keywords for matching
const categoryKeywords: Record<string, string[]> = {
  'Meals & Entertainment': [
    'restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner',
    'starbucks', 'mcdonald', 'subway', 'pizza', 'bar', 'grill', 'bistro',
  ],
  'Travel': [
    'hotel', 'motel', 'airline', 'flight', 'uber', 'lyft', 'taxi', 'gas',
    'fuel', 'parking', 'rental car', 'airbnb', 'booking', 'expedia',
  ],
  'Office Supplies': [
    'office', 'staples', 'depot', 'supplies', 'paper', 'printer', 'ink',
    'pens', 'notebooks', 'folders', 'desk',
  ],
  'Vehicle Expenses': [
    'gas station', 'shell', 'chevron', 'exxon', 'bp', 'tire', 'auto',
    'car wash', 'repair', 'maintenance',
  ],
  'Utilities': [
    'electric', 'gas company', 'water', 'internet', 'phone', 'cable',
    'utility', 'power', 'at&t', 'verizon', 'comcast',
  ],
  'Rent': [
    'rent', 'lease', 'landlord', 'apartment', 'office space',
  ],
  'Professional Services': [
    'lawyer', 'attorney', 'accountant', 'consultant', 'legal', 'cpa',
    'advisory', 'professional',
  ],
  'Software & Subscriptions': [
    'software', 'subscription', 'saas', 'adobe', 'microsoft', 'apple',
    'cloud', 'hosting', 'domain', 'github', 'slack', 'zoom',
  ],
  'Marketing & Advertising': [
    'advertising', 'marketing', 'google ads', 'facebook ads', 'promotion',
    'seo', 'social media',
  ],
  'Insurance': [
    'insurance', 'premium', 'coverage', 'policy',
  ],
}

export function categorizeReceipt(
  merchant: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  defaultCategories: Array<{ id: string; name: string; irsCategory: string | null }>
): CategorySuggestion | null {
  const searchText = `${merchant} ${items.map(i => i.name).join(' ')}`.toLowerCase()

  // Score each category based on keyword matches
  const categoryScores: Record<string, number> = {}

  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    let score = 0
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 1
      }
    }
    if (score > 0) {
      categoryScores[categoryName] = score
    }
  }

  // Find best matching category
  const sortedCategories = Object.entries(categoryScores).sort(
    (a, b) => b[1] - a[1]
  )

  if (sortedCategories.length === 0) {
    return null
  }

  const [bestCategoryName, score] = sortedCategories[0]
  const confidence = Math.min(score / 3, 1) // Normalize to 0-1

  // Find matching default category or create suggestion
  const matchingCategory = defaultCategories.find(
    cat => cat.name === bestCategoryName || cat.irsCategory === bestCategoryName
  )

  if (matchingCategory) {
    return {
      categoryId: matchingCategory.id,
      categoryName: matchingCategory.name,
      confidence,
      irsCategory: matchingCategory.irsCategory,
    }
  }

  // Return suggestion for new category
  return {
    categoryId: '',
    categoryName: bestCategoryName,
    confidence,
    irsCategory: bestCategoryName,
  }
}

export async function initializeDefaultCategories(userId: string) {
  const { prisma } = await import('./prisma')
  
  const defaultCategories = [
    { name: 'Meals & Entertainment', irsCategory: IRS_CATEGORIES.MEALS, color: '#ef4444' },
    { name: 'Travel', irsCategory: IRS_CATEGORIES.TRAVEL, color: '#3b82f6' },
    { name: 'Office Supplies', irsCategory: IRS_CATEGORIES.OFFICE, color: '#10b981' },
    { name: 'Vehicle Expenses', irsCategory: IRS_CATEGORIES.VEHICLE, color: '#f59e0b' },
    { name: 'Utilities', irsCategory: IRS_CATEGORIES.UTILITIES, color: '#8b5cf6' },
    { name: 'Rent', irsCategory: IRS_CATEGORIES.RENT, color: '#ec4899' },
    { name: 'Professional Services', irsCategory: IRS_CATEGORIES.PROFESSIONAL, color: '#06b6d4' },
    { name: 'Software & Subscriptions', irsCategory: IRS_CATEGORIES.SOFTWARE, color: '#6366f1' },
    { name: 'Marketing & Advertising', irsCategory: IRS_CATEGORIES.MARKETING, color: '#f97316' },
    { name: 'Insurance', irsCategory: IRS_CATEGORIES.INSURANCE, color: '#84cc16' },
    { name: 'Other', irsCategory: IRS_CATEGORIES.OTHER, color: '#6b7280' },
  ]

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId,
          name: category.name,
        },
      },
      create: {
        userId,
        name: category.name,
        irsCategory: category.irsCategory,
        color: category.color,
        isDefault: true,
      },
      update: {},
    })
  }
}


