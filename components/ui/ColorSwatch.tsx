'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

interface ColorSwatchProps {
  hex: string;
  size?: 'sm' | 'md' | 'lg';
  showHex?: boolean;
  copyable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ColorSwatch({
  hex,
  size = 'md',
  showHex = true,
  copyable = true,
  selected = false,
  onClick,
  className = '',
}: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const handleClick = async () => {
    if (onClick) {
      onClick();
    }

    if (copyable) {
      try {
        await navigator.clipboard.writeText(hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy color:', error);
      }
    }
  };

  // Calculate if color is dark for text color determination
  const isDark = () => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <button
        onClick={handleClick}
        className={`
          ${sizeStyles[size]}
          rounded-lg border-2 relative
          ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'}
          ${copyable ? 'cursor-pointer hover:scale-105' : ''}
          transition-all duration-200
          ${copied ? 'ring-2 ring-green-400' : ''}
        `}
        style={{ backgroundColor: hex }}
        title={copyable ? `Click to copy ${hex}` : hex}
      >
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check
              className="h-4 w-4"
              style={{ color: isDark() ? 'white' : 'black' }}
            />
          </div>
        )}
      </button>

      {showHex && (
        <span className="text-xs font-mono text-gray-600">
          {hex.toUpperCase()}
        </span>
      )}
    </div>
  );
}
