/**
 * Smart Folder Suggestions
 * ML-powered folder recommendations using pgvector similarity
 */

import { supabaseServer } from '../supabase-server';
import { AI_CONFIG } from './config';
import { logAIOperation } from './utils';
import type { SimilarFolderResult, FolderSuggestion } from '../supabase';

/**
 * Get folder suggestions for a mockup based on content similarity
 */
export async function suggestFoldersForMockup(
  mockupId: string,
  orgId: string,
  userId: string
): Promise<FolderSuggestion[]> {
  try {
    logAIOperation('Generating folder suggestions', { mockupId, orgId });

    // Get the mockup's embedding
    const { data: metadata, error: metadataError } = await supabaseServer
      .from('mockup_ai_metadata')
      .select('embedding')
      .eq('mockup_id', mockupId)
      .single();

    if (metadataError || !metadata?.embedding) {
      console.warn('[Folder Suggestions] No embedding found for mockup:', mockupId);
      return [];
    }

    // Call the RPC function to find similar folders
    const { data: similarFolders, error: rpcError } = await supabaseServer
      .rpc('find_similar_folders', {
        target_embedding: metadata.embedding,
        org_id: orgId,
        limit_count: AI_CONFIG.DEFAULT_FOLDER_SUGGESTIONS,
      });

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    if (!similarFolders || similarFolders.length === 0) {
      logAIOperation('No similar folders found', { mockupId });
      return [];
    }

    // Convert to FolderSuggestion format with reasons
    const suggestions: FolderSuggestion[] = similarFolders.map(
      (folder: SimilarFolderResult) => {
        const confidence = Math.round(folder.avg_similarity * 100) / 100;
        const reason = generateSuggestionReason(folder, confidence);

        return {
          id: '', // Will be generated on insert
          mockup_id: mockupId,
          suggested_folder_id: folder.folder_id,
          confidence,
          reason,
          accepted: null,
          user_id: userId,
          created_at: new Date().toISOString(),
          folder: {
            id: folder.folder_id,
            name: folder.folder_name,
            mockup_count: Number(folder.mockup_count),
          } as any,
        };
      }
    );

    // Store suggestions in database for learning
    const suggestionsToStore = suggestions.map(s => ({
      mockup_id: s.mockup_id,
      suggested_folder_id: s.suggested_folder_id,
      confidence: s.confidence,
      reason: s.reason,
      user_id: s.user_id,
    }));

    const { error: insertError } = await supabaseServer
      .from('folder_suggestions')
      .insert(suggestionsToStore);

    if (insertError) {
      console.warn('[Folder Suggestions] Failed to store suggestions:', insertError);
      // Continue anyway - don't fail the whole operation
    }

    logAIOperation('Generated folder suggestions', {
      mockupId,
      count: suggestions.length,
    });

    return suggestions;
  } catch (error) {
    console.error('[Folder Suggestions] Error:', error);
    return [];
  }
}

/**
 * Generate a human-readable reason for the suggestion
 */
function generateSuggestionReason(folder: SimilarFolderResult, confidence: number): string {
  const mockupCount = Number(folder.mockup_count);
  const similarityPercent = Math.round(confidence * 100);

  if (similarityPercent >= 80) {
    return `Very similar to ${mockupCount} mockup${mockupCount !== 1 ? 's' : ''} in this folder (${similarityPercent}% match)`;
  } else if (similarityPercent >= 70) {
    return `Similar content to ${mockupCount} mockup${mockupCount !== 1 ? 's' : ''} in this folder (${similarityPercent}% match)`;
  } else if (similarityPercent >= 60) {
    return `Somewhat similar to ${mockupCount} mockup${mockupCount !== 1 ? 's' : ''} in this folder (${similarityPercent}% match)`;
  } else {
    return `Potentially related to ${mockupCount} mockup${mockupCount !== 1 ? 's' : ''} in this folder (${similarityPercent}% match)`;
  }
}

/**
 * Record user's acceptance or rejection of a suggestion
 */
export async function recordSuggestionFeedback(
  suggestionId: string,
  accepted: boolean
): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('folder_suggestions')
      .update({ accepted })
      .eq('id', suggestionId);

    if (error) {
      throw error;
    }

    logAIOperation('Recorded suggestion feedback', { suggestionId, accepted });
  } catch (error) {
    console.error('[Folder Suggestions] Failed to record feedback:', error);
  }
}

/**
 * Get suggestion accuracy metrics (for admin dashboard)
 */
export async function getSuggestionMetrics(orgId: string): Promise<{
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  acceptanceRate: number;
}> {
  try {
    // Get all suggestions for the org
    const { data: suggestions, error } = await supabaseServer
      .from('folder_suggestions')
      .select(`
        id,
        accepted,
        mockup_id,
        card_mockups!inner(organization_id)
      `)
      .eq('card_mockups.organization_id', orgId);

    if (error) {
      throw error;
    }

    const total = suggestions?.length || 0;
    const accepted = suggestions?.filter(s => s.accepted === true).length || 0;
    const rejected = suggestions?.filter(s => s.accepted === false).length || 0;
    const pending = suggestions?.filter(s => s.accepted === null).length || 0;
    const acceptanceRate = total > 0 ? (accepted / (accepted + rejected)) * 100 : 0;

    return {
      total,
      accepted,
      rejected,
      pending,
      acceptanceRate: Math.round(acceptanceRate),
    };
  } catch (error) {
    console.error('[Folder Suggestions] Failed to get metrics:', error);
    return {
      total: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
      acceptanceRate: 0,
    };
  }
}

/**
 * Get recent suggestions for a user
 */
export async function getUserRecentSuggestions(
  userId: string,
  limit: number = 10
): Promise<FolderSuggestion[]> {
  try {
    const { data, error } = await supabaseServer
      .from('folder_suggestions')
      .select(`
        *,
        folder:folders(id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[Folder Suggestions] Failed to get user suggestions:', error);
    return [];
  }
}

/**
 * Find folders that contain similar mockups (without needing a specific mockup ID)
 * Useful for browsing and discovering related content
 */
export async function findSimilarFoldersToTags(
  tags: string[],
  orgId: string
): Promise<Array<{ folder_id: string; folder_name: string; relevance: number }>> {
  try {
    // This would require generating an embedding from the tags
    // For now, we'll use a simple text-based approach
    const searchText = tags.join(' ');

    const { data, error } = await supabaseServer
      .from('folders')
      .select(`
        id,
        name,
        card_mockups!inner(
          id,
          mockup_ai_metadata(search_text)
        )
      `)
      .eq('organization_id', orgId);

    if (error) {
      throw error;
    }

    // Calculate relevance based on tag matches
    // This is a simplified version - in production, you'd use embeddings
    const folderScores = new Map<string, { name: string; score: number }>();

    data?.forEach((folder: any) => {
      let score = 0;
      folder.card_mockups?.forEach((mockup: any) => {
        const searchText = mockup.mockup_ai_metadata?.search_text || '';
        tags.forEach(tag => {
          if (searchText.toLowerCase().includes(tag.toLowerCase())) {
            score++;
          }
        });
      });

      if (score > 0) {
        folderScores.set(folder.id, { name: folder.name, score });
      }
    });

    // Convert to array and sort by score
    const results = Array.from(folderScores.entries())
      .map(([folder_id, { name, score }]) => ({
        folder_id,
        folder_name: name,
        relevance: score,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, AI_CONFIG.DEFAULT_FOLDER_SUGGESTIONS);

    return results;
  } catch (error) {
    console.error('[Folder Suggestions] Failed to find similar folders:', error);
    return [];
  }
}
