import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { ProjectStatus } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects
 *
 * Get all projects for the current organization with mockup counts
 *
 * Query params:
 * - status?: 'active' | 'completed' | 'archived' (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as ProjectStatus | null;

    // Build query
    let query = supabase
      .from('projects')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Database error fetching projects:', error);
      throw error;
    }

    // Fetch mockup counts and previews for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        // Get mockup count
        const { count } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('organization_id', orgId);

        // Get up to 4 mockup previews
        const { data: mockupPreviews } = await supabase
          .from('assets')
          .select('id, mockup_name, mockup_image_url')
          .eq('project_id', project.id)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(4);

        return {
          ...project,
          mockup_count: count || 0,
          mockup_previews: mockupPreviews || [],
        };
      })
    );

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error('Error fetching projects:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 *
 * Create a new project
 *
 * Body:
 * {
 *   name: string (required),
 *   client_name?: string (optional),
 *   description?: string (optional),
 *   status?: 'active' | 'completed' | 'archived' (default: 'active'),
 *   color?: string (default: '#3B82F6')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();

    const body = await request.json();
    const { name, client_name, description, status, color, workflow_id } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Project name must be less than 100 characters' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses: ProjectStatus[] = ['active', 'completed', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, completed, or archived' },
        { status: 400 }
      );
    }

    // Validate color format if provided (basic hex check)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Must be a hex color (e.g., #3B82F6)' },
        { status: 400 }
      );
    }

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        client_name: client_name?.trim() || null,
        description: description?.trim() || null,
        status: status || 'active',
        color: color || '#3B82F6',
        workflow_id: workflow_id || null,
        organization_id: orgId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating project:', error);
      throw error;
    }

    return NextResponse.json(
      { project: { ...project, mockup_count: 0 } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
