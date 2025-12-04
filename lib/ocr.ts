import { ImageAnnotatorClient } from '@google-cloud/vision'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

let visionClient: ImageAnnotatorClient | null = null
let s3Client: S3Client | null = null

// Initialize Google Vision client
function getVisionClient() {
  if (!visionClient && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    })
  }
  return visionClient
}

// Initialize S3 client
function getS3Client() {
  if (!s3Client && process.env.AWS_ACCESS_KEY_ID) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }
  return s3Client
}

export interface ExtractedReceiptData {
  merchant: string
  date: Date | null
  total: number
  tax: number
  subtotal: number | null
  items: Array<{ name: string; price: number; quantity: number }>
  paymentMethod: string | null
  rawText: string
}

export async function extractReceiptData(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedReceiptData> {
  const client = getVisionClient()
  
  if (!client) {
    // Fallback: Return basic structure if OCR not configured
    return {
      merchant: 'Unknown',
      date: new Date(),
      total: 0,
      tax: 0,
      subtotal: null,
      items: [],
      paymentMethod: null,
      rawText: '',
    }
  }

  try {
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    })

    const detections = result.textAnnotations || []
    const fullText = detections[0]?.description || ''

    // Parse receipt data from text
    const extracted = parseReceiptText(fullText)

    return {
      ...extracted,
      rawText: fullText,
    }
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('Failed to extract receipt data')
  }
}

function parseReceiptText(text: string): Omit<ExtractedReceiptData, 'rawText'> {
  const lines = text.split('\n').filter(line => line.trim())
  
  // Extract merchant (usually first line or contains common business words)
  let merchant = 'Unknown'
  const merchantPatterns = [
    /^([A-Z][A-Z\s&]+)/,
    /(STORE|SHOP|MARKET|RESTAURANT|CAFE|GAS|STATION)/i,
  ]
  
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern)
    if (match) {
      merchant = match[1]?.trim() || match[0]?.trim() || 'Unknown'
      break
    }
  }
  if (merchant === 'Unknown' && lines.length > 0) {
    merchant = lines[0].trim()
  }

  // Extract date
  let date: Date | null = null
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ]
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      date = new Date(match[1])
      if (!isNaN(date.getTime())) break
    }
  }
  if (!date) date = new Date()

  // Extract total (look for patterns like "TOTAL: $XX.XX" or "TOTAL $XX.XX")
  let total = 0
  const totalPatterns = [
    /TOTAL[:\s]+[\$]?(\d+\.\d{2})/i,
    /AMOUNT[:\s]+[\$]?(\d+\.\d{2})/i,
    /[\$](\d+\.\d{2})\s*TOTAL/i,
  ]
  for (const pattern of totalPatterns) {
    const match = text.match(pattern)
    if (match) {
      total = parseFloat(match[1])
      break
    }
  }

  // Extract tax
  let tax = 0
  const taxPatterns = [
    /TAX[:\s]+[\$]?(\d+\.\d{2})/i,
    /SALES\s+TAX[:\s]+[\$]?(\d+\.\d{2})/i,
  ]
  for (const pattern of taxPatterns) {
    const match = text.match(pattern)
    if (match) {
      tax = parseFloat(match[1])
      break
    }
  }

  // Extract subtotal
  let subtotal: number | null = null
  const subtotalPattern = /SUBTOTAL[:\s]+[\$]?(\d+\.\d{2})/i
  const subtotalMatch = text.match(subtotalPattern)
  if (subtotalMatch) {
    subtotal = parseFloat(subtotalMatch[1])
  }

  // Extract items (lines that look like item descriptions with prices)
  const items: Array<{ name: string; price: number; quantity: number }> = []
  const itemPattern = /^(.+?)\s+[\$]?(\d+\.\d{2})/
  for (const line of lines) {
    const match = line.match(itemPattern)
    if (match && !line.match(/TOTAL|TAX|SUBTOTAL|CHANGE/i)) {
      items.push({
        name: match[1].trim(),
        price: parseFloat(match[2]),
        quantity: 1,
      })
    }
  }

  // Extract payment method
  let paymentMethod: string | null = null
  const paymentPatterns = [
    /(CASH|CREDIT|DEBIT|VISA|MASTERCARD|AMEX|DISCOVER)/i,
  ]
  for (const pattern of paymentPatterns) {
    const match = text.match(pattern)
    if (match) {
      paymentMethod = match[1].toUpperCase()
      break
    }
  }

  return {
    merchant,
    date,
    total,
    tax,
    subtotal,
    items,
    paymentMethod,
  }
}

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client()
  
  if (!client || !process.env.AWS_S3_BUCKET) {
    // For MVP, return local path if S3 not configured
    return `/uploads/${key}`
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  } catch (error) {
    console.error('S3 Upload Error:', error)
    throw new Error('Failed to upload file')
  }
}

