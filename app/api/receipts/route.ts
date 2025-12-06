import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const merchant = searchParams.get('merchant')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const tag = searchParams.get('tag')

    const where: any = { userId }

    if (merchant) {
      where.merchant = { contains: merchant, mode: 'insensitive' }
    }
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }
    if (minAmount || maxAmount) {
      where.total = {}
      if (minAmount) where.total.gte = parseFloat(minAmount)
      if (maxAmount) where.total.lte = parseFloat(maxAmount)
    }
    if (tag) {
      where.tags = { has: tag }
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ])

    return NextResponse.json({
      receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}


