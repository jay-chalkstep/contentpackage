import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'

export async function PATCH(request: NextRequest) {
  try {
    // Get current user and verify they're an admin
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.profile.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { name, logo_url, brand_color } = await request.json()

    const supabase = await createServerSupabaseClient()

    // Update organization
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name,
        logo_url,
        brand_color,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json(
        { message: 'Failed to update organization settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: data
    })

  } catch (error) {
    console.error('Error in organization settings API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
