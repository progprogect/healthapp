"use client"

import { signOut } from "next-auth/react"
import Providers from "./Providers"

function LogoutButtonForm() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      Выйти
    </button>
  )
}

export default function LogoutButton() {
  return (
    <Providers>
      <LogoutButtonForm />
    </Providers>
  )
}
