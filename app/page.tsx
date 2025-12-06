import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-foreground mb-6">
            ReceiptVault
          </h1>
          <p className="text-2xl text-foreground/80 mb-8">
            Smart Receipt Management & Expense Tracking
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Automatically extract, categorize, and organize receipts from emails, 
            photos, and forwarded messages. Never lose a receipt again.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/sign-in"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md"
            >
              Get Started Free
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-4 bg-card text-card-foreground rounded-lg font-semibold border-2 border-border hover:bg-accent transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Auto-Capture</h3>
              <p className="text-muted-foreground">
                Forward receipts via email or connect Gmail/Outlook for automatic scanning
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Smart Extraction</h3>
              <p className="text-muted-foreground">
                AI-powered OCR extracts merchant, date, amount, and items with 95%+ accuracy
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Tax-Ready Reports</h3>
              <p className="text-muted-foreground">
                Generate IRS-compliant reports and export to CSV, PDF, or Excel
              </p>
            </div>
          </div>

          <div className="mt-16 bg-card p-8 rounded-lg shadow-lg border border-border">
            <h2 className="text-3xl font-bold mb-6 text-card-foreground">Pricing</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-2 border-border rounded-lg p-6 bg-background">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Free</h3>
                <p className="text-4xl font-bold mb-4 text-foreground">$0<span className="text-lg">/month</span></p>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>✓ 20 receipts/month</li>
                  <li>✓ Basic categorization</li>
                  <li>✓ 1 year storage</li>
                </ul>
              </div>
              <div className="border-2 border-primary rounded-lg p-6 bg-primary/10">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Pro</h3>
                <p className="text-4xl font-bold mb-4 text-foreground">$9.99<span className="text-lg">/month</span></p>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>✓ Unlimited receipts</li>
                  <li>✓ Advanced categorization</li>
                  <li>✓ Lifetime storage</li>
                  <li>✓ Export reports</li>
                  <li>✓ 2 integrations</li>
                </ul>
              </div>
              <div className="border-2 border-border rounded-lg p-6 bg-background">
                <h3 className="text-2xl font-bold mb-2 text-foreground">Business</h3>
                <p className="text-4xl font-bold mb-4 text-foreground">$29.99<span className="text-lg">/month</span></p>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Multi-user (up to 10)</li>
                  <li>✓ Unlimited integrations</li>
                  <li>✓ API access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


