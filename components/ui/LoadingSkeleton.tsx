'use client';

import { Sparkles } from 'lucide-react';

type SkeletonShape = 'card' | 'grid' | 'text' | 'badge' | 'circle' | 'bar';

interface LoadingSkeletonProps {
  shape?: SkeletonShape;
  count?: number;
  width?: string;
  height?: string;
  className?: string;
  showSparkle?: boolean;
}

export default function LoadingSkeleton({
  shape = 'card',
  count = 1,
  width,
  height,
  className = '',
  showSparkle = false,
}: LoadingSkeletonProps) {
  const getShapeStyles = () => {
    switch (shape) {
      case 'card':
        return 'h-48 w-full rounded-lg';
      case 'grid':
        return 'h-32 w-32 rounded-lg';
      case 'text':
        return 'h-4 w-full rounded';
      case 'badge':
        return 'h-6 w-20 rounded-full';
      case 'circle':
        return 'h-12 w-12 rounded-full';
      case 'bar':
        return 'h-2 w-full rounded-full';
      default:
        return 'h-24 w-full rounded-lg';
    }
  };

  const baseStyles = `
    bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
    animate-shimmer bg-[length:200%_100%]
  `;

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`
        ${baseStyles}
        ${getShapeStyles()}
        ${className}
      `}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
    />
  ));

  return (
    <div className="space-y-2">
      {showSparkle && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm text-gray-500">AI is processing...</span>
        </div>
      )}
      {items}
    </div>
  );
}

// Add shimmer animation to globals.css or tailwind config:
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }
