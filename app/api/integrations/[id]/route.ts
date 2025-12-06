import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.integration.updateMany({
      where: {
        id: params.id,
        userId: userId,
      },
      data: {
        isActive: false,
      },
    })

    if (integration.count === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}

