'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, X, Clock, TrendingUp } from 'lucide-react';
import { useAI } from '@/contexts/AIContext';
import Badge from '@/components/ui/Badge';
import type { SearchMode } from '@/types/ai';

interface AISearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const exampleQueries = [
  'blue backgrounds with minimal text',
  'high contrast designs',
  'mockups with logos',
  'designs approved last week',
];

export default function AISearchBar({
  onSearch,
  placeholder = 'Search with AI or keywords...',
  autoFocus = false,
  className = '',
}: AISearchBarProps) {
  const { searchMode, setSearchMode, recentSearches, addRecentSearch } = useAI();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }

    // Keyboard shortcut: Cmd+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const performSearch = (searchQuery: string) => {
    setIsSearching(true);
    addRecentSearch(searchQuery);
    onSearch(searchQuery, searchMode);
    setShowSuggestions(false);
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* Mode Indicator Icon */}
          <div className="absolute left-4 pointer-events-none">
            {searchMode === 'ai' ? (
              <Sparkles className="h-5 w-5 text-purple-600" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={`
              w-full pl-12 pr-24 py-3 rounded-lg border-2
              ${searchMode === 'ai'
                ? 'border-purple-300 focus:border-purple-500 bg-gradient-to-r from-purple-50/50 to-blue-50/50'
                : 'border-gray-300 focus:border-blue-500'
              }
              focus:outline-none focus:ring-2
              ${searchMode === 'ai' ? 'focus:ring-purple-200' : 'focus:ring-blue-200'}
              transition-all duration-200
            `}
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-20 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className={`
              absolute right-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${searchMode === 'ai'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setSearchMode('ai')}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${searchMode === 'ai'
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }
            `}
          >
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI Search
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('exact')}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${searchMode === 'exact'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }
            `}
          >
            Exact Match
          </button>
          <span className="text-xs text-gray-400 self-center ml-auto">
            ⌘K to focus
          </span>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length === 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">Recent</span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => performSearch(search)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Example Queries */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold text-gray-600">Try these</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => performSearch(example)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Badge variant="ai" size="sm">
                    {example}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
