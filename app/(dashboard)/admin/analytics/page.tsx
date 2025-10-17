'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import {
  getAnalyticsSummary,
  getRecentActivity,
  getAssetTrends,
  type AnalyticsSummary,
  type ActivityLog,
  type AssetTrend
} from '@/lib/analytics/queries'
import StatCard from '@/components/analytics/StatCard'
import ActivityTimeline from '@/components/analytics/ActivityTimeline'
import AssetChart from '@/components/analytics/AssetChart'
import {
  Users, Activity, Image, FileText, File, HardDrive
} from 'lucide-react'

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [trends, setTrends] = useState<AssetTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(30)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setOrganizationId(profile.organization_id)

      // Load analytics data in parallel
      const [summaryData, activityData, trendsData] = await Promise.all([
        getAnalyticsSummary(profile.organization_id),
        getRecentActivity(profile.organization_id, 20),
        getAssetTrends(profile.organization_id, dateRange)
      ])

      setSummary(summaryData)
      setActivities(activityData)
      setTrends(trendsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-[#374151] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Track usage metrics, user activity, and organization insights
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Period:</span>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              onClick={() => setDateRange(7)}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                dateRange === 7
                  ? 'bg-[#374151] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange(30)}
              className={`px-4 py-2 text-sm font-medium border-x border-gray-300 ${
                dateRange === 30
                  ? 'bg-[#374151] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange(90)}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                dateRange === 90
                  ? 'bg-[#374151] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={summary?.total_users || 0}
          subtitle={`${summary?.active_users || 0} active`}
          icon={Users}
          iconColor="#374151"
        />
        <StatCard
          title="Active Users"
          value={summary?.active_users_30d || 0}
          subtitle="Last 30 days"
          icon={Activity}
          iconColor="#3b82f6"
        />
        <StatCard
          title="Total Logos"
          value={summary?.total_logos || 0}
          icon={Image}
          iconColor="#10b981"
        />
        <StatCard
          title="Total Templates"
          value={summary?.total_templates || 0}
          icon={FileText}
          iconColor="#8b5cf6"
        />
        <StatCard
          title="Total Mockups"
          value={summary?.total_mockups || 0}
          icon={File}
          iconColor="#f59e0b"
        />
        <StatCard
          title="Storage Used"
          value={`${(summary?.total_storage_mb || 0).toFixed(1)} MB`}
          icon={HardDrive}
          iconColor="#ef4444"
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <AssetChart data={trends} />
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline activities={activities} />
    </div>
  )
}