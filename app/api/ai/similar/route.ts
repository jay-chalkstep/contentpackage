/**
 * AI Similar Mockups API Endpoint
 * POST /api/ai/similar
 * Finds similar mockups using pgvector similarity search
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';
import { AI_CONFIG } from '@/lib/ai/config';
import { logAIOperation } from '@/lib/ai/utils';
import type { SimilarMockupResult } from '@/lib/supabase';

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
    const { mockupId, limit } = await req.json();

    if (!mockupId) {
      return NextResponse.json(
        { error: 'mockupId is required' },
        { status: 400 }
      );
    }

    const searchLimit = limit || AI_CONFIG.DEFAULT_SIMILAR_COUNT;

    logAIOperation('Finding similar mockups', { mockupId, limit: searchLimit });

    // Verify mockup belongs to user's organization
    const { data: mockup, error: mockupError } = await supabaseServer
      .from('card_mockups')
      .select('organization_id')
      .eq('id', mockupId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 }
      );
    }

    if (mockup.organization_id !== orgId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if mockup has been analyzed (has embedding)
    const { data: aiMetadata, error: metadataError } = await supabaseServer
      .from('mockup_ai_metadata')
      .select('embedding')
      .eq('mockup_id', mockupId)
      .single();

    if (metadataError || !aiMetadata || !aiMetadata.embedding) {
      return NextResponse.json(
        {
          error: 'Mockup has not been analyzed yet. Please analyze it first using the AI analysis feature.',
          analyzed: false,
        },
        { status: 400 }
      );
    }

    // Call the RPC function to find similar mockups
    const { data: similarMockups, error: rpcError } = await supabaseServer.rpc(
      'find_similar_mockups',
      {
        mockup_id: mockupId,
        match_count: searchLimit,
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const results = (similarMockups || []) as SimilarMockupResult[];

    logAIOperation('Found similar mockups', {
      mockupId,
      count: results.length,
    });

    return NextResponse.json({
      success: true,
      mockupId,
      similar: results,
      count: results.length,
    });
  } catch (error) {
    console.error('[AI Similar API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving similar mockups (alternative to POST)
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
    const mockupId = searchParams.get('mockupId');
    const limit = parseInt(searchParams.get('limit') || String(AI_CONFIG.DEFAULT_SIMILAR_COUNT), 10);

    if (!mockupId) {
      return NextResponse.json(
        { error: 'mockupId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify mockup belongs to user's organization
    const { data: mockup, error: mockupError } = await supabaseServer
      .from('card_mockups')
      .select('organization_id')
      .eq('id', mockupId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 }
      );
    }

    if (mockup.organization_id !== orgId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if mockup has been analyzed
    const { data: aiMetadata, error: metadataError } = await supabaseServer
      .from('mockup_ai_metadata')
      .select('embedding')
      .eq('mockup_id', mockupId)
      .single();

    if (metadataError || !aiMetadata || !aiMetadata.embedding) {
      return NextResponse.json(
        {
          error: 'Mockup has not been analyzed yet',
          analyzed: false,
        },
        { status: 400 }
      );
    }

    // Find similar mockups
    const { data: similarMockups, error: rpcError } = await supabaseServer.rpc(
      'find_similar_mockups',
      {
        mockup_id: mockupId,
        match_count: limit,
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    return NextResponse.json({
      success: true,
      mockupId,
      similar: similarMockups || [],
      count: (similarMockups || []).length,
    });
  } catch (error) {
    console.error('[AI Similar API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
