import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/mockups
 *
 * Get all mockups for a specific project
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Verify project exists and belongs to organization
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch mockups for this project with logo and template data
    const { data: mockups, error: mockupsError } = await supabase
      .from('card_mockups')
      .select(`
        *,
        logo:logo_variants!logo_id (
          id,
          logo_url
        ),
        template:card_templates!template_id (
          id,
          template_name,
          template_url
        )
      `)
      .eq('project_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (mockupsError) {
      console.error('Database error fetching project mockups:', mockupsError);
      throw mockupsError;
    }

    return NextResponse.json({ mockups: mockups || [] });
  } catch (error) {
    console.error('Error fetching project mockups:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch project mockups' },
      { status: 500 }
    );
  }
}
