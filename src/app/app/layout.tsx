import { ReactNode } from 'react';
import { Metadata } from 'next';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'HealthApp - Личный кабинет',
  description: 'Управление заявками, чат и профиль специалиста',
};

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Providers>
      <AppShell>
        {children}
      </AppShell>
    </Providers>
  );
}
