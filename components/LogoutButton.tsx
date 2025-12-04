'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-4 py-2 text-sm text-gray-700 hover:text-primary-600"
    >
      Sign Out
    </button>
  )
}


