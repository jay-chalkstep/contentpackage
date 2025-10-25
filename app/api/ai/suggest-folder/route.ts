/**
 * AI Folder Suggestion API Endpoint
 * POST /api/ai/suggest-folder
 * Suggests folders for a mockup based on content similarity
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServerServer } from '@/lib/supabaseServer-server';
import { suggestFoldersForMockup, recordSuggestionFeedback } from '@/lib/ai/folder-suggestions';
import { logAIOperation } from '@/lib/ai/utils';

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
    const { mockupId } = await req.json();

    if (!mockupId) {
      return NextResponse.json(
        { error: 'mockupId is required' },
        { status: 400 }
      );
    }

    logAIOperation('Generating folder suggestions', { mockupId, orgId });

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
          error: 'Mockup has not been analyzed yet. Please analyze it first.',
          analyzed: false,
        },
        { status: 400 }
      );
    }

    // Get folder suggestions
    const suggestions = await suggestFoldersForMockup(mockupId, orgId, userId);

    return NextResponse.json({
      success: true,
      mockupId,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('[AI Suggest Folder API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH endpoint to record user feedback on suggestions
export async function PATCH(req: NextRequest) {
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
    const { suggestionId, accepted } = await req.json();

    if (!suggestionId || typeof accepted !== 'boolean') {
      return NextResponse.json(
        { error: 'suggestionId and accepted (boolean) are required' },
        { status: 400 }
      );
    }

    // Verify suggestion belongs to user
    const { data: suggestion, error: suggestionError } = await supabaseServer
      .from('folder_suggestions')
      .select('user_id')
      .eq('id', suggestionId)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    if (suggestion.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Record feedback
    await recordSuggestionFeedback(suggestionId, accepted);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    console.error('[AI Suggest Folder API] Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve suggestion history
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
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (mockupId) {
      // Get suggestions for a specific mockup
      const { data: suggestions, error } = await supabaseServer
        .from('folder_suggestions')
        .select(`
          *,
          folder:folders(id, name)
        `)
        .eq('mockup_id', mockupId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        suggestions: suggestions || [],
      });
    } else {
      // Get recent suggestions for the user
      const { data: suggestions, error } = await supabaseServer
        .from('folder_suggestions')
        .select(`
          *,
          folder:folders(id, name),
          mockup:card_mockups!inner(organization_id)
        `)
        .eq('user_id', userId)
        .eq('mockup.organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        suggestions: suggestions || [],
      });
    }
  } catch (error) {
    console.error('[AI Suggest Folder API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
