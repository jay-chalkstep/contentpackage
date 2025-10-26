'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BreadcrumbProps {
  path: string[]; // ['Projects', 'Q4 Campaign', 'Mockup #123']
  onNavigate?: (index: number) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const router = useRouter();

  if (path.length === 0) return null;

  const handleNavigate = (index: number) => {
    if (onNavigate) {
      onNavigate(index);
    }
  };

  return (
    <nav
      className="bg-white border-b border-[var(--border-main)] px-4 py-2 text-sm flex items-center gap-2"
      aria-label="Breadcrumb"
    >
      {path.map((segment, index) => (
        <div key={index} className="flex items-center gap-2">
          {index < path.length - 1 ? (
            <>
              <button
                onClick={() => handleNavigate(index)}
                className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors font-medium"
              >
                {segment}
              </button>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </>
          ) : (
            <span className="text-[var(--text-primary)] font-medium">
              {segment}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
