import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              ReceiptVault
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                Receipts
              </Link>
              <Link href="/dashboard/reports" className="text-gray-700 hover:text-primary-600">
                Reports
              </Link>
              <Link href="/dashboard/settings" className="text-gray-700 hover:text-primary-600">
                Settings
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}


