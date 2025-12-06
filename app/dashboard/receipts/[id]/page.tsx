import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ReceiptDetail from '@/components/ReceiptDetail'
import { syncUserToDatabase } from '@/lib/user-sync'

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Sync user to database
  await syncUserToDatabase(userId)

  const receiptData = await prisma.receipt.findFirst({
    where: {
      id: params.id,
      userId: userId,
    },
    include: {
      category: true,
    },
  })

  if (!receiptData) {
    redirect('/dashboard')
  }

  // Convert Date objects to strings and properly type items for client component
  const receipt = {
    ...receiptData,
    date: receiptData.date.toISOString(),
    warrantyExpiresAt: receiptData.warrantyExpiresAt
      ? receiptData.warrantyExpiresAt.toISOString()
      : null,
    items: Array.isArray(receiptData.items)
      ? (receiptData.items as Array<{ name: string; price: number; quantity: number }>)
      : null,
  }

  return <ReceiptDetail receipt={receipt} />
}


