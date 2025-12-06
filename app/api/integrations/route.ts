import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { canAddIntegration } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrations = await prisma.integration.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
    })

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { provider, accessToken, refreshToken, expiresAt, config } = body

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Check if user can add more integrations
    const canAdd = await canAddIntegration(userId)
    if (!canAdd) {
      return NextResponse.json(
        { error: 'Integration limit reached for your subscription tier' },
        { status: 403 }
      )
    }

    const integration = await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      create: {
        userId,
        provider,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        config: config || {},
        isActive: true,
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        config: config || {},
        isActive: true,
      },
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error: any) {
    console.error('Integration error:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}

