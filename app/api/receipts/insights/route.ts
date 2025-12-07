import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateReceiptInsights } from '@/lib/receipt-insights'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's receipts
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    })

    // Generate insights using Gemini
    const insights = await generateReceiptInsights(
      receipts.map(r => ({
        merchant: r.merchant,
        total: r.total,
        date: r.date,
        category: r.category,
      }))
    )

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

