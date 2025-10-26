'use client';

import { AIProvider } from '@/contexts/AIContext';
import { PanelProvider } from '@/lib/contexts/PanelContext';
import AppHeader from '@/components/layout/AppHeader';
import GmailLayout from '@/components/layout/GmailLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AIProvider>
      <PanelProvider>
        <AppHeader />
        <GmailLayout>
          {children}
        </GmailLayout>
      </PanelProvider>
    </AIProvider>
  );
}
