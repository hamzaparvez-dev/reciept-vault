import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'ReceiptVault - Smart Receipt Management',
  description: 'Automatically extract, categorize, and organize your receipts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={poppins.variable}>
        <body className="font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}


