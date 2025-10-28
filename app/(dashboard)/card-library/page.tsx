'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@clerk/nextjs';
import { Loader2, ArrowRight } from 'lucide-react';

export default function CardLibraryPage() {
  const router = useRouter();
  const { membership, isLoaded } = useOrganization();
  const isAdmin = membership?.role === 'org:admin';

  useEffect(() => {
    if (isLoaded) {
      // Redirect to admin templates page
      router.replace('/admin/templates');
    }
  }, [router, isLoaded]);

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] flex items-center gap-2">
          Redirecting to Templates
          <ArrowRight size={16} />
        </p>
      </div>
    </div>
  );
}
