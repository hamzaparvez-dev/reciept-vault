import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SettingsView from '@/components/SettingsView'
import { syncUserToDatabase } from '@/lib/user-sync'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) return null

  // Sync user to database
  await syncUserToDatabase(userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  const categories = await prisma.category.findMany({
    where: { userId: userId },
    orderBy: { name: 'asc' },
  })

  return <SettingsView user={user} categories={categories} />
}


