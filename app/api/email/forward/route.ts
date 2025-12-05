import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractReceiptData, uploadToS3 } from '@/lib/ocr'
import { categorizeReceipt } from '@/lib/categorization'
import nodemailer from 'nodemailer'

// This endpoint would be called by an email service (like SendGrid, Mailgun, etc.)
// when an email is forwarded to receipts@receiptvault.com
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, subject, text, html, attachments } = body

    // Store email forward
    const emailForward = await prisma.emailForward.create({
      data: {
        fromEmail: from,
        subject,
        body: text || html,
        attachments: attachments || [],
      },
    })

    // Process attachments (receipt images)
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          // In production, you'd fetch the attachment from the email service
          // For now, we'll assume the attachment data is provided
          const imageBuffer = Buffer.from(attachment.data, 'base64')

          // Upload to S3
          const fileKey = `receipts/email/${Date.now()}-${attachment.filename}`
          const imageUrl = await uploadToS3(imageBuffer, fileKey, attachment.contentType)

          // Extract receipt data
          const extractedData = await extractReceiptData(imageBuffer, attachment.contentType)

          // Find user by email or use a default user
          // In production, you'd match the forwarding email to a user
          const user = await prisma.user.findFirst({
            where: { email: from },
          })

          if (user) {
            // Get categories for auto-categorization
            const categories = await prisma.category.findMany({
              where: { userId: user.id },
            })

            // Auto-categorize
            let categoryId: string | null = null
            if (extractedData.merchant) {
              const suggestion = categorizeReceipt(
                extractedData.merchant,
                extractedData.items || [],
                categories.map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  irsCategory: cat.irsCategory,
                }))
              )
              if (suggestion && suggestion.categoryId) {
                categoryId = suggestion.categoryId
              }
            }

            // Create receipt
            await prisma.receipt.create({
              data: {
                userId: user.id,
                merchant: extractedData.merchant,
                date: extractedData.date || new Date(),
                total: extractedData.total,
                tax: extractedData.tax,
                subtotal: extractedData.subtotal,
                items: extractedData.items || [],
                paymentMethod: extractedData.paymentMethod,
                categoryId,
                imageUrl,
                imageKey: fileKey,
                ocrData: {
                  ...extractedData,
                  date: extractedData.date ? extractedData.date.toISOString() : null,
                } as any,
                extractionStatus: 'COMPLETED',
                source: 'EMAIL',
              },
            })

            // Update email forward
            await prisma.emailForward.update({
              where: { id: emailForward.id },
              data: { processed: true },
            })
          }
        } catch (error) {
          console.error('Error processing attachment:', error)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email forward error:', error)
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    )
  }
}
