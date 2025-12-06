import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              ReceiptVault
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                Receipts
              </Link>
              <Link href="/dashboard/reports" className="text-muted-foreground hover:text-primary transition-colors">
                Reports
              </Link>
              <Link href="/dashboard/settings" className="text-muted-foreground hover:text-primary transition-colors">
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


