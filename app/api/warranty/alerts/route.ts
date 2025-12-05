import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30') // Default: 30 days

    const alertDate = new Date()
    alertDate.setDate(alertDate.getDate() + days)

    const expiringWarranties = await prisma.receipt.findMany({
      where: {
        userId,
        warrantyExpiresAt: {
          not: null,
          lte: alertDate,
          gte: new Date(), // Not expired yet
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        warrantyExpiresAt: 'asc',
      },
    })

    return NextResponse.json({ warranties: expiringWarranties })
  } catch (error) {
    console.error('Warranty alert error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warranty alerts' },
      { status: 500 }
    )
  }
}

