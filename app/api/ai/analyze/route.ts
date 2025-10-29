/**
 * AI Analyze API Endpoint
 * POST /api/ai/analyze
 * Analyzes a mockup using Google Vision and OpenAI to extract tags, colors, text, and embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';
import { analyzeAndTagMockup, getMockupAIMetadata } from '@/lib/ai/vision-tagging';

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

    // Fetch mockup from database
    const { data: mockup, error: mockupError } = await supabaseServer
      .from('assets')
      .select('id, mockup_name, mockup_image_url, organization_id')
      .eq('id', mockupId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json(
        { error: 'Mockup not found' },
        { status: 404 }
      );
    }

    // Verify mockup belongs to user's organization
    if (mockup.organization_id !== orgId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if mockup has an image URL
    if (!mockup.mockup_image_url) {
      return NextResponse.json(
        { error: 'Mockup has no image to analyze' },
        { status: 400 }
      );
    }

    // Analyze the mockup
    const result = await analyzeAndTagMockup(
      mockup.id,
      mockup.mockup_image_url,
      mockup.mockup_name,
      '' // description - mockups don't have descriptions in current schema
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    // Return the AI metadata
    return NextResponse.json({
      success: true,
      metadata: result.metadata,
      message: 'Analysis completed successfully',
    });
  } catch (error) {
    console.error('[AI Analyze API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get mockupId from query params
    const { searchParams } = new URL(req.url);
    const mockupId = searchParams.get('mockupId');

    if (!mockupId) {
      return NextResponse.json(
        { error: 'mockupId is required' },
        { status: 400 }
      );
    }

    // Verify mockup belongs to user's organization
    const { data: mockup, error: mockupError } = await supabaseServer
      .from('assets')
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

    // Get AI metadata
    const metadata = await getMockupAIMetadata(mockupId);

    if (!metadata) {
      return NextResponse.json({
        analyzed: false,
        metadata: null,
      });
    }

    return NextResponse.json({
      analyzed: true,
      metadata,
    });
  } catch (error) {
    console.error('[AI Analyze API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
