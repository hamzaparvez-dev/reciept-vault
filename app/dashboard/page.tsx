import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import ReceiptUpload from '@/components/ReceiptUpload'
import ReceiptList from '@/components/ReceiptList'
import { checkReceiptLimit } from '@/lib/subscription'
import { syncUserToDatabase } from '@/lib/user-sync'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  // Sync user to database
  await syncUserToDatabase(userId)
  const limitCheck = await checkReceiptLimit(userId)

  const receiptsData = await prisma.receipt.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 20,
  })

  // Convert Date objects to strings for client component
  const receipts = receiptsData.map(receipt => ({
    ...receipt,
    date: receipt.date.toISOString(),
  }))

  const stats = await prisma.receipt.aggregate({
    where: { userId },
    _sum: { total: true, tax: true },
    _count: true,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage your receipts and track expenses</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Receipts</div>
          <div className="text-3xl font-bold text-card-foreground">
            {stats._count || 0}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
          <div className="text-3xl font-bold text-card-foreground">
            ${(stats._sum.total || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="text-sm text-muted-foreground mb-1">This Month</div>
          <div className="text-3xl font-bold text-card-foreground">
            {limitCheck.current} / {limitCheck.limit === Infinity ? '∞' : limitCheck.limit}
          </div>
          {limitCheck.limit !== Infinity && (
            <div className="text-xs text-muted-foreground mt-1">
              {limitCheck.limit - limitCheck.current} remaining
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <ReceiptUpload />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Recent Receipts</h2>
        <ReceiptList initialReceipts={receipts} />
      </div>
    </div>
  )
}


