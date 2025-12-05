import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  }

  // Check if critical env vars are missing
  if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      {
        ...health,
        status: 'error',
        message: 'Missing required environment variables. Please check DATABASE_URL and NEXTAUTH_SECRET.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json(health)
}

