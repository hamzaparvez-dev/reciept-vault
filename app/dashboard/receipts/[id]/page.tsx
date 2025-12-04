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

  const receipt = await prisma.receipt.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      category: true,
    },
  })

  if (!receipt) {
    redirect('/dashboard')
  }

  return <ReceiptDetail receipt={receipt} />
}


