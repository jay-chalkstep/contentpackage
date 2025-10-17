import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'

export async function PATCH(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { full_name, avatar_url, notification_preferences } = await request.json()

    const supabase = await createServerSupabaseClient()

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name,
        avatar_url,
        notification_preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.profile.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { message: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('Error in profile settings API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
