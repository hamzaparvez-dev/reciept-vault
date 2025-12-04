import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReceiptUpload from '@/components/ReceiptUpload'
import ReceiptList from '@/components/ReceiptList'
import { checkReceiptLimit } from '@/lib/subscription'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const userId = session.user.id
  const limitCheck = await checkReceiptLimit(userId)

  const receipts = await prisma.receipt.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 20,
  })

  const stats = await prisma.receipt.aggregate({
    where: { userId },
    _sum: { total: true, tax: true },
    _count: true,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your receipts and track expenses</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Receipts</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats._count || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Spent</div>
          <div className="text-3xl font-bold text-gray-900">
            ${(stats._sum.total || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-3xl font-bold text-gray-900">
            {limitCheck.current} / {limitCheck.limit === Infinity ? '∞' : limitCheck.limit}
          </div>
          {limitCheck.limit !== Infinity && (
            <div className="text-xs text-gray-500 mt-1">
              {limitCheck.limit - limitCheck.current} remaining
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <ReceiptUpload />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Receipts</h2>
        <ReceiptList initialReceipts={receipts} />
      </div>
    </div>
  )
}


