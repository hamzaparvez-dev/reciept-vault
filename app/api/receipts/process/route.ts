import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { extractReceiptData } from '@/lib/ocr'
import { smartCategorizeReceipt } from '@/lib/smart-categorization'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for OCR

/**
 * Background processing endpoint
 * Called by Cloudflare Worker to process receipts asynchronously
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (from Cloudflare Worker)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Also allow authenticated users to trigger processing
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { receiptId, imageUrl, userId: providedUserId } = await request.json()
    
    if (!receiptId) {
      return NextResponse.json({ error: 'receiptId is required' }, { status: 400 })
    }

    // Get userId from auth or provided
    const { userId } = await auth()
    const finalUserId = userId || providedUserId

    if (!finalUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Update status to PROCESSING
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { extractionStatus: 'PROCESSING' },
    })

    // Fetch image
    let imageBuffer: Buffer
    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
      }
      const arrayBuffer = await imageResponse.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } catch (error) {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { extractionStatus: 'FAILED' },
      })
      throw new Error(`Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Extract receipt data using OCR (Gemini or Google Vision)
    let extractedData
    try {
      extractedData = await extractReceiptData(imageBuffer, 'image/jpeg')
    } catch (error) {
      console.error('OCR extraction failed:', error)
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { extractionStatus: 'FAILED' },
      })
      throw error
    }

    // Get user and categories
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { user: true },
    })

    if (!receipt) {
      throw new Error('Receipt not found')
    }

    const categories = await prisma.category.findMany({
      where: { userId: receipt.userId },
    })

    // Auto-categorize using smart AI categorization
    let finalCategoryId = receipt.categoryId
    if (!finalCategoryId && extractedData.merchant) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const suggestion = await smartCategorizeReceipt(
            extractedData.merchant,
            extractedData.items || [],
            extractedData.total,
            extractedData.date || new Date(),
            categories.map(cat => ({
              id: cat.id,
              name: cat.name,
              irsCategory: cat.irsCategory,
            }))
          )

          if (suggestion?.categoryId) {
            finalCategoryId = suggestion.categoryId
          } else if (suggestion && !suggestion.categoryId && suggestion.categoryName) {
            // Create new category if suggested
            const newCategory = await prisma.category.create({
              data: {
                userId: receipt.userId,
                name: suggestion.categoryName,
                irsCategory: suggestion.irsCategory,
                isDefault: false,
              },
            })
            finalCategoryId = newCategory.id
          }
        } catch (error) {
          console.error('Smart categorization failed:', error)
        }
      }
    }

    // Update receipt with extracted data
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        merchant: extractedData.merchant || receipt.merchant,
        date: extractedData.date || receipt.date,
        total: extractedData.total || receipt.total,
        tax: extractedData.tax,
        subtotal: extractedData.subtotal,
        items: extractedData.items || [],
        paymentMethod: extractedData.paymentMethod,
        categoryId: finalCategoryId,
        ocrData: {
          ...extractedData,
          date: extractedData.date?.toISOString(),
        },
        extractionStatus: 'COMPLETED',
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      receipt: updatedReceipt 
    })
  } catch (error) {
    console.error('Processing error:', error)
    
    // Try to mark as failed if we have receiptId
    try {
      const { receiptId } = await request.json().catch(() => ({}))
      if (receiptId) {
        await prisma.receipt.update({
          where: { id: receiptId },
          data: { extractionStatus: 'FAILED' },
        })
      }
    } catch (updateError) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}

