"use client"

import { SessionProvider } from 'next-auth/react'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Перепроверять каждые 5 минут вместо постоянно
      refetchOnWindowFocus={false} // Не проверять при фокусе окна
      refetchWhenOffline={false} // Не проверять когда offline
    >
      {children}
    </SessionProvider>
  )
}
