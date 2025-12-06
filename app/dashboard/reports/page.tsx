import { auth } from '@clerk/nextjs/server'
import ReportsView from '@/components/ReportsView'
import { syncUserToDatabase } from '@/lib/user-sync'

export default async function ReportsPage() {
  const { userId } = await auth()
  if (!userId) return null

  // Sync user to database
  await syncUserToDatabase(userId)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
        <p className="text-muted-foreground">View expense summaries and generate tax reports</p>
      </div>
      <ReportsView />
    </div>
  )
}


