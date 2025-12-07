import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractReceiptData } from '@/lib/ocr'
import { smartCategorizeReceipt } from '@/lib/smart-categorization'

export const dynamic = 'force-dynamic'

/**
 * Cron job endpoint - processes pending receipts
 * Called by Cloudflare Worker cron trigger every 5 minutes
 */
export async function GET(request: NextRequest) {
  // Verify authorization (from Cloudflare Worker)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get pending receipts (limit to 10 at a time to avoid timeouts)
    const pendingReceipts = await prisma.receipt.findMany({
      where: { extractionStatus: 'PENDING' },
      take: 10,
      orderBy: { createdAt: 'asc' }, // Process oldest first
    })

    if (pendingReceipts.length === 0) {
      return NextResponse.json({ 
        processed: 0, 
        message: 'No pending receipts' 
      })
    }

    let processed = 0
    let failed = 0

    for (const receipt of pendingReceipts) {
      try {
        // Update to processing
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { extractionStatus: 'PROCESSING' },
        })

        // Fetch image
        const imageResponse = await fetch(receipt.imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
        }

        const arrayBuffer = await imageResponse.arrayBuffer()
        const imageBuffer = Buffer.from(arrayBuffer)

        // Extract receipt data
        const extractedData = await extractReceiptData(imageBuffer, 'image/jpeg')

        // Get categories for categorization
        const categories = await prisma.category.findMany({
          where: { userId: receipt.userId },
        })

        // Auto-categorize
        let finalCategoryId = receipt.categoryId
        if (!finalCategoryId && extractedData.merchant && process.env.GEMINI_API_KEY) {
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
            console.error('Categorization failed for receipt', receipt.id, error)
          }
        }

        // Update receipt
        await prisma.receipt.update({
          where: { id: receipt.id },
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
        })

        processed++
      } catch (error) {
        console.error(`Failed to process receipt ${receipt.id}:`, error)
        
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { extractionStatus: 'FAILED' },
        })
        
        failed++
      }
    }

    return NextResponse.json({
      processed,
      failed,
      total: pendingReceipts.length,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron job failed' },
      { status: 500 }
    )
  }
}

