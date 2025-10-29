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

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('name');

    if (error) {
      console.error('Database error fetching templates:', error);
      throw error;
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching templates:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
