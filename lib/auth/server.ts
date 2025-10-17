import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase-types'

// Re-declare types here to avoid client/server import issues
export interface UserProfile {
  id: string
  organization_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'user'
  department?: string
  job_title?: string
  phone?: string
  is_active: boolean
  joined_at: string
  last_login?: string
  storage_used_mb: number
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string
  subscription_status: 'trial' | 'active' | 'canceled' | 'past_due'
  subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise'
  subscription_end_date?: string
  max_users: number
  max_storage_mb: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = await createServerSupabaseClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session) {
    return null
  }

  const profile = await getUserProfile(session.user.id)

  if (!profile) {
    return null
  }

  const organization = profile.organization_id
    ? await getOrganization(profile.organization_id)
    : null

  return {
    session,
    profile,
    organization
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireAdmin() {
  const user = await requireAuth()

  if (user.profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}

// Helper function to check if user has access to a resource
export async function canAccessResource(
  resourceType: 'logo' | 'template' | 'mockup',
  resourceId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  const table = resourceType === 'logo' ? 'logos'
    : resourceType === 'template' ? 'card_templates'
    : 'card_mockups'

  const { data, error } = await supabase
    .from(table)
    .select('user_id, organization_id, visibility')
    .eq('id', resourceId)
    .single()

  if (error || !data) {
    return false
  }

  // Check if user owns the resource
  if (data.user_id === userId) {
    return true
  }

  // Check if resource is shared with organization
  const userProfile = await getUserProfile(userId)
  if (userProfile && data.organization_id === userProfile.organization_id) {
    return data.visibility === 'organization'
  }

  return false
}