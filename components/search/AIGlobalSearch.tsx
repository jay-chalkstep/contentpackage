'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'mockup' | 'project' | 'logo';
  title: string;
  subtitle?: string;
  url: string;
}

interface AIGlobalSearchProps {
  className?: string;
}

export default function AIGlobalSearch({ className = '' }: AIGlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent-searches');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse recent searches:', e);
        }
      }
    }
  }, []);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // ESC to close dropdown
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      // Call AI search API
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent-searches', JSON.stringify(updated));
    }
  };

  const handleResultClick = (result: SearchResult) => {
    handleSearch(query);
    window.location.href = result.url;
  };

  const showDropdown = isFocused && (query.trim() || recentSearches.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors duration-200"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search mockups, projects, or ask AI anything..."
          className={`
            w-full h-12 pl-10 pr-20 rounded-lg text-sm
            transition-all duration-200
            ${isFocused
              ? 'bg-white ring-2 ring-blue-500 shadow-md'
              : 'bg-[var(--search-bg)] hover:bg-white'
            }
            focus:outline-none
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 size={16} className="animate-spin text-[var(--text-tertiary)]" />
          )}
          {!isLoading && (
            <>
              <Sparkles size={16} className="text-[var(--accent-purple)]" />
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-[var(--text-tertiary)] bg-white border border-[var(--border-main)] rounded">
                /
              </kbd>
            </>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-[var(--border-main)] overflow-hidden z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                >
                  <Search size={16} className="text-[var(--text-tertiary)]" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query && results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Results
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-3 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-[var(--text-primary)] font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] capitalize">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && !isLoading && results.length === 0 && (
            <div className="p-8 text-center">
              <Sparkles size={32} className="mx-auto mb-2 text-[var(--accent-purple)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                No results found for "{query}"
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Try a different search term or ask AI for help
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
