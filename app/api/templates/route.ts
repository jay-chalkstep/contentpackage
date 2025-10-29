import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { createServerAdminClient } from '@/lib/supabase/server';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/templates
 *
 * Get all card templates for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();
    const supabase = createServerAdminClient();

    console.log('[templates] Fetching for org:', orgId);

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('template_name');

    if (error) {
      console.error('[templates] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          error: 'Database error',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('[templates] Found', templates?.length || 0, 'templates');
    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('[templates] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
