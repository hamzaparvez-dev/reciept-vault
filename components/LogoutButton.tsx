'use client'

import { SignOutButton } from '@clerk/nextjs'

export default function LogoutButton() {
  return (
    <SignOutButton>
      <button className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        Sign Out
      </button>
    </SignOutButton>
  )
}


