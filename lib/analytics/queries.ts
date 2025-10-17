import { createClient } from '@/lib/auth/config'

export interface AnalyticsSummary {
  total_users: number
  active_users: number
  active_users_7d: number
  active_users_30d: number
  total_logos: number
  total_templates: number
  total_mockups: number
  activities_7d: number
  activities_30d: number
  total_storage_mb: number
}

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  description: string | null
  created_at: string
  user_profiles?: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface AssetTrend {
  date: string
  logos: number
  templates: number
  mockups: number
}

export interface UserGrowth {
  date: string
  total_users: number
  active_users: number
}

/**
 * Get organization analytics summary
 */
export async function getAnalyticsSummary(organizationId: string): Promise<AnalyticsSummary | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('organization_analytics_summary')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching analytics summary:', error)
    return null
  }

  return data
}

/**
 * Get recent activity logs
 */
export async function getRecentActivity(
  organizationId: string,
  limit: number = 20
): Promise<ActivityLog[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_activity_logs')
    .select(`
      id,
      user_id,
      activity_type,
      description,
      created_at,
      user_profiles (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }

  return data || []
}

/**
 * Get asset creation trends over time
 */
export async function getAssetTrends(
  organizationId: string,
  days: number = 30
): Promise<AssetTrend[]> {
  const supabase = createClient()

  // Get user IDs in the organization
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('organization_id', organizationId)

  if (!users || users.length === 0) {
    return []
  }

  const userIds = users.map(u => u.id)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Fetch logos created
  const { data: logos } = await supabase
    .from('logos')
    .select('created_at')
    .in('user_id', userIds)
    .gte('created_at', startDate.toISOString())

  // Fetch templates created
  const { data: templates } = await supabase
    .from('card_templates')
    .select('created_at')
    .in('user_id', userIds)
    .gte('created_at', startDate.toISOString())

  // Fetch mockups created
  const { data: mockups } = await supabase
    .from('card_mockups')
    .select('created_at')
    .in('user_id', userIds)
    .gte('created_at', startDate.toISOString())

  // Group by date
  const trends: { [key: string]: AssetTrend } = {}

  const addToTrends = (items: any[] | null, type: 'logos' | 'templates' | 'mockups') => {
    if (!items) return

    items.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = { date, logos: 0, templates: 0, mockups: 0 }
      }
      trends[date][type]++
    })
  }

  addToTrends(logos, 'logos')
  addToTrends(templates, 'templates')
  addToTrends(mockups, 'mockups')

  // Convert to array and sort by date
  return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get user growth over time
 */
export async function getUserGrowth(
  organizationId: string,
  days: number = 90
): Promise<UserGrowth[]> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('joined_at, is_active')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true })

  if (error || !users) {
    console.error('Error fetching user growth:', error)
    return []
  }

  // Group users by join date
  const growth: { [key: string]: { total: number; active: number } } = {}

  users.forEach(user => {
    const date = new Date(user.joined_at).toISOString().split('T')[0]
    if (!growth[date]) {
      growth[date] = { total: 0, active: 0 }
    }
    growth[date].total++
    if (user.is_active) {
      growth[date].active++
    }
  })

  // Convert to cumulative growth array
  const growthArray: UserGrowth[] = []
  let cumulativeTotal = 0
  let cumulativeActive = 0

  Object.keys(growth)
    .sort()
    .forEach(date => {
      cumulativeTotal += growth[date].total
      cumulativeActive += growth[date].active
      growthArray.push({
        date,
        total_users: cumulativeTotal,
        active_users: cumulativeActive
      })
    })

  return growthArray.filter(g => new Date(g.date) >= startDate)
}

/**
 * Get top used logos
 */
export async function getTopLogos(organizationId: string, limit: number = 5) {
  const supabase = createClient()

  // Get user IDs in organization
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('organization_id', organizationId)

  if (!users || users.length === 0) {
    return []
  }

  const userIds = users.map(u => u.id)

  // Get most saved logos
  const { data: logos } = await supabase
    .from('logos')
    .select('brand_name, logo_url, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  return logos || []
}

/**
 * Get storage breakdown by user
 */
export async function getStorageByUser(organizationId: string) {
  const supabase = createClient()

  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, storage_used_mb')
    .eq('organization_id', organizationId)
    .order('storage_used_mb', { ascending: false })

  if (error) {
    console.error('Error fetching storage by user:', error)
    return []
  }

  return users || []
}
