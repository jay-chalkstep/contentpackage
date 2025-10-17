'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import ImageUpload from '@/components/settings/ImageUpload'
import { Save, Loader2, Mail, Bell } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  notification_preferences?: any
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [notifyOnInvite, setNotifyOnInvite] = useState(true)
  const [notifyOnReview, setNotifyOnReview] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({ ...profileData, email: user.email || '' })
        setFullName(profileData.full_name || '')
        setAvatarUrl(profileData.avatar_url || '')

        // Load notification preferences
        const prefs = profileData.notification_preferences || {}
        setNotifyOnInvite(prefs.on_invite !== false)
        setNotifyOnReview(prefs.on_review !== false)
        setWeeklyDigest(prefs.weekly_digest === true)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
          notification_preferences: {
            on_invite: notifyOnInvite,
            on_review: notifyOnReview,
            weekly_digest: weeklyDigest
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Update your personal information and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-700">{profile?.email}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-[#374151]"
                placeholder="Enter your full name"
              />
            </div>

            {/* Avatar Upload */}
            <ImageUpload
              currentImageUrl={avatarUrl}
              onUploadComplete={setAvatarUrl}
              bucketName="assets"
              folder="user-avatars"
              label="Profile Picture"
              aspectRatio="1:1"
              maxSizeMB={2}
            />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-[#374151] mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifyInvite"
                  type="checkbox"
                  checked={notifyOnInvite}
                  onChange={(e) => setNotifyOnInvite(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#374151] focus:ring-[#374151]"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifyInvite" className="text-sm font-medium text-gray-700">
                  Team invitations
                </label>
                <p className="text-xs text-gray-500">
                  Receive notifications when you're invited to a new organization
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifyReview"
                  type="checkbox"
                  checked={notifyOnReview}
                  onChange={(e) => setNotifyOnReview(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#374151] focus:ring-[#374151]"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifyReview" className="text-sm font-medium text-gray-700">
                  Review assignments
                </label>
                <p className="text-xs text-gray-500">
                  Receive notifications when you're assigned to review an asset
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="weeklyDigest"
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#374151] focus:ring-[#374151]"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="weeklyDigest" className="text-sm font-medium text-gray-700">
                  Weekly activity digest
                </label>
                <p className="text-xs text-gray-500">
                  Receive a weekly summary of your organization's activity
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Profile updated successfully!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#374151] rounded-lg hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}