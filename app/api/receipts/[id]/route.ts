import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: params.id,
        userId: userId,
      },
      include: {
        category: true,
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json({ receipt })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { merchant, date, total, tax, subtotal, categoryId, tags, notes, warrantyExpiresAt, warrantyItem } = body

    const receipt = await prisma.receipt.updateMany({
      where: {
        id: params.id,
        userId: userId,
      },
      data: {
        ...(merchant && { merchant }),
        ...(date && { date: new Date(date) }),
        ...(total !== undefined && { total }),
        ...(tax !== undefined && { tax }),
        ...(subtotal !== undefined && { subtotal }),
        ...(categoryId !== undefined && { categoryId }),
        ...(tags && { tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()) }),
        ...(notes !== undefined && { notes }),
        ...(warrantyExpiresAt && { warrantyExpiresAt: new Date(warrantyExpiresAt) }),
        ...(warrantyItem && { warrantyItem }),
      },
    })

    if (receipt.count === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    const updatedReceipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: { category: true },
    })

    return NextResponse.json({ receipt: updatedReceipt })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update receipt' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receipt = await prisma.receipt.deleteMany({
      where: {
        id: params.id,
        userId: userId,
      },
    })

    if (receipt.count === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Update user's receipt count
    await prisma.user.update({
      where: { id: userId },
      data: {
        receiptsCount: {
          decrement: 1,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    )
  }
}


