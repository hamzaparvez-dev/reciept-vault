import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { extractReceiptData, uploadToS3 } from '@/lib/ocr'
import { categorizeReceipt } from '@/lib/categorization'
import { smartCategorizeReceipt } from '@/lib/smart-categorization'
import { detectDuplicateReceipt } from '@/lib/duplicate-detection'
import { checkReceiptLimit } from '@/lib/subscription'
import { syncUserToDatabase } from '@/lib/user-sync'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sync user to database
    await syncUserToDatabase(userId)

    // Check receipt limit
    const limitCheck = await checkReceiptLimit(userId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Receipt limit exceeded',
          limit: limitCheck.limit,
          current: limitCheck.current,
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const merchant = formData.get('merchant') as string | null
    const date = formData.get('date') as string | null
    const categoryId = formData.get('categoryId') as string | null
    const tags = formData.get('tags') as string | null
    const notes = formData.get('notes') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to S3
    const fileKey = `receipts/${userId}/${Date.now()}-${file.name}`
    const imageUrl = await uploadToS3(buffer, fileKey, file.type)

    // Create receipt with PENDING status (will be processed in background)
    const receipt = await prisma.receipt.create({
      data: {
        userId,
        merchant: merchant || 'Processing...',
        date: date ? new Date(date) : new Date(),
        total: 0,
        tax: 0,
        subtotal: null,
        items: [],
        paymentMethod: null,
        categoryId: categoryId || null,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        notes: notes || null,
        imageUrl,
        imageKey: fileKey,
        extractionStatus: 'PENDING', // Will be processed in background
      },
      include: {
        category: true,
      },
    })

    // Queue background processing via Cloudflare Worker (non-blocking)
    if (process.env.CLOUDFLARE_WORKER_URL) {
      fetch(`${process.env.CLOUDFLARE_WORKER_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: receipt.id,
          imageUrl,
          userId,
        }),
      }).catch(err => {
        console.error('Failed to queue background processing:', err)
        // Continue - cron job will pick it up
      })
    }

    // Update user's receipt count
    await prisma.user.update({
      where: { id: userId },
      data: {
        receiptsCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ receipt }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload receipt' },
      { status: 500 }
    )
  }
}


