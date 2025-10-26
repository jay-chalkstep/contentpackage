'use client';

import { AIProvider } from '@/contexts/AIContext';
import { PanelProvider } from '@/lib/contexts/PanelContext';
import GmailLayout from '@/components/layout/GmailLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AIProvider>
      <PanelProvider>
        <GmailLayout>
          {children}
        </GmailLayout>
      </PanelProvider>
    </AIProvider>
  );
}
