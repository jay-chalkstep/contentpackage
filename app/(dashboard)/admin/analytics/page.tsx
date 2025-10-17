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
  const [error, setError] = useState<string | null>(null)
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

      // Check if analytics tables exist by trying to query them
      const { error: tableCheckError } = await supabase
        .from('user_activity_logs')
        .select('id')
        .limit(1)

      if (tableCheckError && tableCheckError.message.includes('does not exist')) {
        setError('migrations_pending')
        setLoading(false)
        return
      }

      // Load analytics data in parallel
      const [summaryData, activityData, trendsData] = await Promise.all([
        getAnalyticsSummary(profile.organization_id),
        getRecentActivity(profile.organization_id, 20),
        getAssetTrends(profile.organization_id, dateRange)
      ])

      setSummary(summaryData)
      setActivities(activityData)
      setTrends(trendsData)
      setError(null)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('unknown')
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

  if (error === 'migrations_pending') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Database Migrations Required
              </h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>The analytics feature requires database migrations to be applied. Please follow these steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Run the migration file: <code className="bg-yellow-100 px-2 py-0.5 rounded">supabase/migrations/002_add_analytics.sql</code></li>
                  <li>Run the subscription migration: <code className="bg-yellow-100 px-2 py-0.5 rounded">supabase/migrations/003_add_subscription_fields.sql</code></li>
                  <li>Refresh this page</li>
                </ol>
                <p className="mt-3">See <code className="bg-yellow-100 px-2 py-0.5 rounded">SETUP_GUIDE.md</code> for detailed instructions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error === 'unknown') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
              <p className="text-sm text-red-700">
                There was an error loading the analytics data. Please check the browser console for details.
              </p>
            </div>
          </div>
        </div>
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