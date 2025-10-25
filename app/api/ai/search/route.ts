/**
 * AI Search API Endpoint
 * POST /api/ai/search
 * Performs semantic and hybrid search using OpenAI embeddings and pgvector
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getOpenAIClient, AI_MODELS, AI_CONFIG } from '@/lib/ai/config';
import { logAIOperation } from '@/lib/ai/utils';
import type { HybridSearchResult } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { query, searchType = 'hybrid' } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required and must be a string' },
        { status: 400 }
      );
    }

    logAIOperation('AI Search', { query, searchType, orgId });

    // Determine if it's a natural language query
    const isNaturalLanguage = query.split(' ').length > 2;

    let results: any[] = [];

    if (searchType === 'semantic' || searchType === 'hybrid') {
      // Generate embedding for the query
      const openai = getOpenAIClient();
      const embeddingResponse = await openai.embeddings.create({
        model: AI_MODELS.EMBEDDING,
        input: query,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Store query for analytics
      await supabaseServer.from('search_queries').insert({
        query,
        query_embedding: queryEmbedding,
        natural_language: isNaturalLanguage,
        user_id: userId,
        org_id: orgId,
      });

      if (searchType === 'hybrid' && isNaturalLanguage) {
        // Hybrid search: combines text search + vector similarity
        const { data: hybridData, error: hybridError } = await supabaseServer.rpc(
          'hybrid_search_mockups',
          {
            text_query: query,
            query_embedding: queryEmbedding,
            match_count: AI_CONFIG.DEFAULT_SEARCH_RESULTS,
            org_id: orgId,
          }
        );

        if (hybridError) {
          throw new Error(`Hybrid search error: ${hybridError.message}`);
        }

        results = hybridData || [];
      } else {
        // Pure semantic search using vector similarity
        const { data: semanticData, error: semanticError } = await supabaseServer.rpc(
          'search_mockups_by_embedding',
          {
            query_embedding: queryEmbedding,
            match_threshold: AI_CONFIG.SIMILARITY_THRESHOLD,
            match_count: AI_CONFIG.DEFAULT_SEARCH_RESULTS,
            org_id: orgId,
          }
        );

        if (semanticError) {
          throw new Error(`Semantic search error: ${semanticError.message}`);
        }

        results = semanticData || [];
      }
    } else {
      // Fallback to traditional text search if searchType is 'text'
      const { data: mockups, error: searchError } = await supabaseServer
        .from('card_mockups')
        .select(`
          id,
          mockup_name,
          mockup_image_url,
          folder_id,
          project_id,
          created_at
        `)
        .eq('organization_id', orgId)
        .ilike('mockup_name', `%${query}%`)
        .limit(AI_CONFIG.DEFAULT_SEARCH_RESULTS);

      if (searchError) {
        throw new Error(`Text search error: ${searchError.message}`);
      }

      results = mockups || [];
    }

    // Update search query with results count
    await supabaseServer
      .from('search_queries')
      .update({ results_count: results.length })
      .eq('query', query)
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1);

    logAIOperation('Search completed', { resultsCount: results.length });

    return NextResponse.json({
      success: true,
      results,
      query,
      searchType,
      resultsCount: results.length,
    });
  } catch (error) {
    console.error('[AI Search API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve search history
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get recent search queries for the user
    const { data: queries, error } = await supabaseServer
      .from('search_queries')
      .select('id, query, natural_language, results_count, created_at')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch search history: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      queries: queries || [],
    });
  } catch (error) {
    console.error('[AI Search API] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    );
  }
}
