'use client';

import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

export type AIIndicatorState = 'processing' | 'completed' | 'error';

interface AIIndicatorProps {
  state: AIIndicatorState;
  lastAnalyzed?: string | Date;
  compact?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export default function AIIndicator({
  state,
  lastAnalyzed,
  compact = false,
  showTooltip = true,
  className = '',
}: AIIndicatorProps) {
  const getIcon = () => {
    switch (state) {
      case 'processing':
        return <Loader2 className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />;
      case 'completed':
        return <Sparkles className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />;
      case 'error':
        return <AlertCircle className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />;
    }
  };

  const getStyles = () => {
    switch (state) {
      case 'processing':
        return 'bg-blue-100 text-blue-600 border-blue-300';
      case 'completed':
        return 'bg-purple-100 text-purple-600 border-purple-300';
      case 'error':
        return 'bg-red-100 text-red-600 border-red-300';
    }
  };

  const getTooltipText = () => {
    switch (state) {
      case 'processing':
        return 'AI analysis in progress...';
      case 'completed':
        return lastAnalyzed
          ? `Analyzed ${typeof lastAnalyzed === 'string' ? new Date(lastAnalyzed).toLocaleString() : lastAnalyzed.toLocaleString()}`
          : 'AI analyzed';
      case 'error':
        return 'AI analysis failed';
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`
          inline-flex items-center gap-1
          ${compact ? 'p-1' : 'px-2 py-1'}
          rounded-full border
          ${getStyles()}
          ${state === 'processing' ? 'animate-pulse' : ''}
        `}
      >
        {getIcon()}
        {!compact && (
          <span className="text-xs font-medium">
            {state === 'processing' ? 'Analyzing' : state === 'completed' ? 'AI' : 'Error'}
          </span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg whitespace-nowrap">
          {getTooltipText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
