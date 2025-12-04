import { prisma } from './prisma'

export type SubscriptionTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'

export const SUBSCRIPTION_LIMITS = {
  FREE: {
    receiptsPerMonth: 20,
    storageYears: 1,
    integrations: 0,
    users: 1,
  },
  PRO: {
    receiptsPerMonth: Infinity,
    storageYears: Infinity,
    integrations: 2,
    users: 1,
  },
  BUSINESS: {
    receiptsPerMonth: Infinity,
    storageYears: Infinity,
    integrations: Infinity,
    users: 10,
  },
  ENTERPRISE: {
    receiptsPerMonth: Infinity,
    storageYears: Infinity,
    integrations: Infinity,
    users: Infinity,
  },
}

export async function checkReceiptLimit(userId: string): Promise<{
  allowed: boolean
  limit: number
  current: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const tier = user.subscriptionTier as SubscriptionTier
  const limit = SUBSCRIPTION_LIMITS[tier]?.receiptsPerMonth || 20

  if (limit === Infinity) {
    return { allowed: true, limit: Infinity, current: 0 }
  }

  // Count receipts uploaded this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const current = await prisma.receipt.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
      },
    },
  })

  return {
    allowed: current < limit,
    limit,
    current,
  }
}

export async function canAddIntegration(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return false
  }

  const tier = user.subscriptionTier as SubscriptionTier
  const limit = SUBSCRIPTION_LIMITS[tier]?.integrations || 0

  if (limit === Infinity) {
    return true
  }

  const current = await prisma.integration.count({
    where: {
      userId,
      isActive: true,
    },
  })

  return current < limit
}


