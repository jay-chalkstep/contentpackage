'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useDeleteWithConfirm<T>(
  tableName: string,
  itemName: string,
  onSuccess: () => void,
  onError?: (error: Error) => void
) {

  const handleDelete = useCallback(async (id: string, displayName?: string) => {
    const confirmMessage = displayName
      ? `Are you sure you want to delete "${displayName}"?`
      : `Are you sure you want to delete this ${itemName}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error(`Error deleting ${itemName}:`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [supabase, tableName, itemName, onSuccess, onError]);

  return handleDelete;
}