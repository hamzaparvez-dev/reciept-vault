import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            ReceiptVault
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            Smart Receipt Management & Expense Tracking
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Automatically extract, categorize, and organize receipts from emails, 
            photos, and forwarded messages. Never lose a receipt again.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2">Auto-Capture</h3>
              <p className="text-gray-600">
                Forward receipts via email or connect Gmail/Outlook for automatic scanning
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Smart Extraction</h3>
              <p className="text-gray-600">
                AI-powered OCR extracts merchant, date, amount, and items with 95%+ accuracy
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Tax-Ready Reports</h3>
              <p className="text-gray-600">
                Generate IRS-compliant reports and export to CSV, PDF, or Excel
              </p>
            </div>
          </div>

          <div className="mt-16 bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6">Pricing</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-4xl font-bold mb-4">$0<span className="text-lg">/month</span></p>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>✓ 20 receipts/month</li>
                  <li>✓ Basic categorization</li>
                  <li>✓ 1 year storage</li>
                </ul>
              </div>
              <div className="border-2 border-primary-600 rounded-lg p-6 bg-primary-50">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-4xl font-bold mb-4">$9.99<span className="text-lg">/month</span></p>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>✓ Unlimited receipts</li>
                  <li>✓ Advanced categorization</li>
                  <li>✓ Lifetime storage</li>
                  <li>✓ Export reports</li>
                  <li>✓ 2 integrations</li>
                </ul>
              </div>
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-2">Business</h3>
                <p className="text-4xl font-bold mb-4">$29.99<span className="text-lg">/month</span></p>
                <ul className="text-left space-y-2 text-gray-600">
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


