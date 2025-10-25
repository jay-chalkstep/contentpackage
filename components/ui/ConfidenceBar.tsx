'use client';

interface ConfidenceBarProps {
  value: number; // 0-100 or 0-1 (will normalize)
  animated?: boolean;
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ConfidenceBar({
  value,
  animated = true,
  showPercentage = true,
  height = 'md',
  className = '',
}: ConfidenceBarProps) {
  // Normalize value to 0-100 range
  const normalizedValue = value > 1 ? value : value * 100;
  const percentage = Math.min(100, Math.max(0, normalizedValue));

  // Color based on confidence level
  const getColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-blue-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const heightStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`
            ${heightStyles[height]}
            ${getColor(percentage)}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
            rounded-full
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">Confidence</span>
          <span className="text-xs font-semibold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
