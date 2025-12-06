import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function syncUserToDatabase(userId: string) {
  try {
    const user = await currentUser()
    if (!user) return null

    return await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.username || null,
        image: user.imageUrl || null,
      },
      update: {
        email: user.emailAddresses[0]?.emailAddress || undefined,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.username || undefined,
        image: user.imageUrl || undefined,
      },
    })
  } catch (error) {
    console.error('Error syncing user to database:', error)
    return null
  }
}

