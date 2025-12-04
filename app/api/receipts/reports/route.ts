import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'monthly' // monthly, yearly, custom
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter: { gte: Date; lte: Date } | undefined

    if (type === 'monthly') {
      const now = new Date()
      dateFilter = {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      }
    } else if (type === 'yearly') {
      const now = new Date()
      dateFilter = {
        gte: startOfYear(now),
        lte: endOfYear(now),
      }
    } else if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        userId,
        ...(dateFilter && { date: dateFilter }),
      },
      include: {
        category: true,
      },
    })

    // Calculate totals
    const total = receipts.reduce((sum, r) => sum + r.total, 0)
    const totalTax = receipts.reduce((sum, r) => sum + (r.tax || 0), 0)
    const totalSubtotal = receipts.reduce((sum, r) => sum + (r.subtotal || r.total - (r.tax || 0)), 0)

    // Group by category
    const byCategory: Record<string, { total: number; count: number; receipts: typeof receipts }> = {}
    receipts.forEach(receipt => {
      const categoryName = receipt.category?.name || 'Uncategorized'
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = { total: 0, count: 0, receipts: [] }
      }
      byCategory[categoryName].total += receipt.total
      byCategory[categoryName].count += 1
      byCategory[categoryName].receipts.push(receipt)
    })

    // Group by month (for trends)
    const byMonth: Record<string, { total: number; count: number }> = {}
    receipts.forEach(receipt => {
      const month = format(receipt.date, 'yyyy-MM')
      if (!byMonth[month]) {
        byMonth[month] = { total: 0, count: 0 }
      }
      byMonth[month].total += receipt.total
      byMonth[month].count += 1
    })

    return NextResponse.json({
      summary: {
        total,
        totalTax,
        totalSubtotal,
        count: receipts.length,
      },
      byCategory: Object.entries(byCategory).map(([name, data]) => ({
        category: name,
        total: data.total,
        count: data.count,
        irsCategory: data.receipts[0]?.category?.irsCategory || null,
      })),
      byMonth: Object.entries(byMonth).map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
      })),
      receipts,
    })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}


