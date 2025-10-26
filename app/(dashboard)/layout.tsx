'use client';

import { AIProvider } from '@/contexts/AIContext';
import { PanelProvider } from '@/lib/contexts/PanelContext';
import AppHeader from '@/components/layout/AppHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AIProvider>
      <PanelProvider>
        <AppHeader />
        {children}
      </PanelProvider>
    </AIProvider>
  );
}
