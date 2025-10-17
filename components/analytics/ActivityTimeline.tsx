'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Search, Save, Upload, Copy, Download, Trash2,
  UserPlus, Settings, Circle
} from 'lucide-react'
import type { ActivityLog } from '@/lib/analytics/queries'

interface ActivityTimelineProps {
  activities: ActivityLog[]
}

const activityIcons: { [key: string]: typeof Circle } = {
  login: Circle,
  logo_search: Search,
  logo_save: Save,
  logo_delete: Trash2,
  template_upload: Upload,
  template_delete: Trash2,
  mockup_create: Circle,
  mockup_duplicate: Copy,
  mockup_export: Download,
  mockup_delete: Trash2,
  user_invite: UserPlus,
  settings_update: Settings,
  other: Circle,
}

const activityColors: { [key: string]: string } = {
  login: '#6b7280',
  logo_search: '#3b82f6',
  logo_save: '#10b981',
  logo_delete: '#ef4444',
  template_upload: '#8b5cf6',
  template_delete: '#ef4444',
  mockup_create: '#f59e0b',
  mockup_duplicate: '#06b6d4',
  mockup_export: '#14b8a6',
  mockup_delete: '#ef4444',
  user_invite: '#ec4899',
  settings_update: '#6366f1',
  other: '#9ca3af',
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, idx) => {
            const Icon = activityIcons[activity.activity_type] || Circle
            const color = activityColors[activity.activity_type] || '#9ca3af'
            const userName = activity.user_profiles?.full_name || activity.user_profiles?.email || 'Unknown user'
            const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })

            return (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx !== activities.length - 1 && (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white"
                        style={{ backgroundColor: color + '20' }}
                      >
                        <Icon className="h-4 w-4" style={{ color }} />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{userName}</span>
                          {' '}
                          <span className="text-gray-600">
                            {activity.description || activity.activity_type.replace('_', ' ')}
                          </span>
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        {timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      {activities.length === 0 && (
        <div className="text-center py-12">
          <Circle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Activity will appear here as your team uses the platform.
          </p>
        </div>
      )}
    </div>
  )
}
