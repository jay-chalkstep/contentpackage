'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { AIContextValue, SearchMode, FolderSuggestion } from '@/types/ai';

const AIContext = createContext<AIContextValue | undefined>(undefined);

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  // Core state
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('ai');
  const [aiEnabled, setAIEnabled] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<FolderSuggestion[]>([]);
  const [processQueue, setProcessQueue] = useState<string[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved

SearchMode = localStorage.getItem('ai_search_mode') as SearchMode;
      const savedOnboarding = localStorage.getItem('ai_onboarding_completed');
      const savedSearches = localStorage.getItem('ai_recent_searches');

      if (savedSearchMode && ['ai', 'exact', 'visual'].includes(savedSearchMode)) {
        setSearchMode(savedSearchMode);
      }

      if (savedOnboarding === 'true') {
        setOnboardingCompleted(true);
      }

      if (savedSearches) {
        try {
          const parsed = JSON.parse(savedSearches);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, 10)); // Keep last 10
          }
        } catch (error) {
          console.error('Failed to parse recent searches:', error);
        }
      }
    }
  }, []);

  // Save search mode to localStorage
  const handleSetSearchMode = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_search_mode', mode);
    }
  }, []);

  // Add recent search
  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      // Remove duplicates and add to front
      const filtered = prev.filter(s => s !== query);
      const updated = [query, ...filtered].slice(0, 10);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_recent_searches', JSON.stringify(updated));
      }

      return updated;
    });
  }, []);

  // Mark onboarding complete
  const markOnboardingComplete = useCallback(() => {
    setOnboardingCompleted(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_onboarding_completed', 'true');
    }
  }, []);

  // Process queue management (for batch AI operations)
  const addToProcessQueue = useCallback((mockupId: string) => {
    setProcessQueue(prev => [...prev, mockupId]);
    setIsProcessing(true);
  }, []);

  const removeFromProcessQueue = useCallback((mockupId: string) => {
    setProcessQueue(prev => {
      const updated = prev.filter(id => id !== mockupId);
      if (updated.length === 0) {
        setIsProcessing(false);
      }
      return updated;
    });
  }, []);

  const value: AIContextValue = {
    isProcessing,
    searchMode,
    aiEnabled,
    recentSearches,
    suggestions,
    processQueue,
    onboardingCompleted,
    setSearchMode: handleSetSearchMode,
    addRecentSearch,
    markOnboardingComplete,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

// Custom hook to use AI context
export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

// Optional: Create a hook for AI processing status
export function useAIProcessing(mockupId: string) {
  const { processQueue } = useAI();
  return processQueue.includes(mockupId);
}
