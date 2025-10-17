'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import { Loader2, Building2 } from 'lucide-react'

export default function OnboardingPage() {
  const [organizationName, setOrganizationName] = useState('')
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Pre-fill organization name from user's email domain or name
        const emailDomain = user.email?.split('@')[1].split('.')[0] || ''
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        setOrganizationName(emailDomain ? `${emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1)} Team` : `${userName}'s Team`)
        setOrganizationSlug(emailDomain || userName.toLowerCase().replace(/[^a-z0-9]/g, ''))
      } else {
        router.push('/login')
      }
    }
    getUser()
  }, [supabase, router])

  const handleOrganizationSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          slug: organizationSlug,
          subscription_status: 'trial',
          subscription_tier: 'free'
        })
        .select()
        .single()

      if (orgError) throw orgError

      // 2. Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          organization_id: orgData.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          role: 'admin' // First user is admin
        })

      if (profileError) throw profileError

      // 3. Create organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert({
          organization_id: orgData.id
        })

      if (settingsError) throw settingsError

      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Failed to set up organization')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome aboard!</h1>
            <p className="mt-2 text-gray-600">
              Let's set up your organization to get started
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleOrganizationSetup} className="space-y-6">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                Organization name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Acme Corporation"
              />
            </div>

            <div>
              <label htmlFor="organizationSlug" className="block text-sm font-medium text-gray-700 mb-1">
                Organization URL
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  cdco.app/
                </span>
                <input
                  id="organizationSlug"
                  name="organizationSlug"
                  type="text"
                  required
                  value={organizationSlug}
                  onChange={(e) => setOrganizationSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-r-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="acme-corp"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This will be your organization's unique URL
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Your free trial includes:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Up to 3 team members</li>
                <li>• 500 MB storage</li>
                <li>• Unlimited mockups for 14 days</li>
                <li>• Full access to all features</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Complete setup'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}