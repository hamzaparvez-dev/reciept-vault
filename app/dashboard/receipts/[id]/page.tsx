import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ReceiptDetail from '@/components/ReceiptDetail'

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const receiptData = await prisma.receipt.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
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


