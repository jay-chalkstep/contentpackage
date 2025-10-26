'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Projects as the default landing page
    router.replace('/projects');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-[var(--accent-blue)]" />
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}
