'use client';

import { useState, useMemo } from 'react';

export function useLocalFilter<T>(
  items: T[],
  searchKeys: (keyof T)[],
  additionalFilter?: (item: T, filterValue: any) => boolean,
  additionalFilterValue?: any
) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(term);
        })
      );
    }

    // Apply additional filter if provided
    if (additionalFilter && additionalFilterValue) {
      filtered = filtered.filter(item => additionalFilter(item, additionalFilterValue));
    }

    return filtered;
  }, [items, searchTerm, searchKeys, additionalFilter, additionalFilterValue]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems
  };
}