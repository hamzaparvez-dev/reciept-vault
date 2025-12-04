import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ReportsView from '@/components/ReportsView'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">View expense summaries and generate tax reports</p>
      </div>
      <ReportsView />
    </div>
  )
}


