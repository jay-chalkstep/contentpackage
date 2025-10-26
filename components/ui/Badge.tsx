'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'ai';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#F3F4F6] text-[var(--text-secondary)]',
  success: 'bg-[#DBEAFE] text-[var(--accent-blue)]',
  warning: 'bg-[#FEF3C7] text-[var(--accent-yellow)]',
  error: 'bg-[#FEE2E2] text-[var(--accent-red)]',
  info: 'bg-[#DBEAFE] text-[var(--accent-blue)]',
  purple: 'bg-[#F3E8FF] text-[var(--accent-purple)]',
  ai: 'bg-[#F3E8FF] text-[var(--accent-purple)]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
