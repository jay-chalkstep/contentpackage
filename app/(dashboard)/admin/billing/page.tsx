'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'
import PlanCard from '@/components/billing/PlanCard'
import { CreditCard, ExternalLink, Users, HardDrive, CheckCircle, XCircle } from 'lucide-react'

interface Organization {
  id: string
  name: string
  subscription_tier?: string
  subscription_status?: string
  max_users?: number
  stripe_customer_id?: string
  subscription_end_date?: string
}

export default function BillingPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [storageUsed, setStorageUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadData()

    // Handle redirect from Stripe
    const success = searchParams?.get('success')
    const canceled = searchParams?.get('canceled')

    if (success) {
      // Show success message
      setTimeout(() => {
        router.replace('/admin/billing')
      }, 3000)
    }

    if (canceled) {
      // Show canceled message
      setTimeout(() => {
        router.replace('/admin/billing')
      }, 3000)
    }
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      // Get organization
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      setOrganization(org)

      // Get user count
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, storage_used_mb')
        .eq('organization_id', profile.organization_id)

      setUserCount(users?.length || 0)

      // Calculate total storage
      const totalStorage = users?.reduce((sum, u) => sum + (u.storage_used_mb || 0), 0) || 0
      setStorageUsed(totalStorage)

    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start checkout. Please try again.')
      setProcessing(false)
    }
  }

  const handleManageSubscription = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to access customer portal')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to access customer portal. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-[#374151] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentTier = organization?.subscription_tier || 'starter'
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentTier)
  const maxUsers = organization?.max_users || 5
  const maxStorage = currentPlan?.storageGB || 10

  const success = searchParams?.get('success')
  const canceled = searchParams?.get('canceled')

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="font-semibold text-green-900">Subscription activated!</p>
              <p className="text-sm text-green-700">Your new plan is now active. Page will refresh shortly...</p>
            </div>
          </div>
        </div>
      )}

      {canceled && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-semibold text-yellow-900">Checkout canceled</p>
              <p className="text-sm text-yellow-700">No charges were made. You can try again anytime.</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Summary */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            <p className="text-gray-600">You're on the {currentPlan?.name} plan</p>
          </div>
          {organization?.stripe_customer_id && (
            <button
              onClick={handleManageSubscription}
              disabled={processing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Subscription
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-[#374151]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-semibold text-gray-900">{currentPlan?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-lg font-semibold text-gray-900">
                {userCount} / {maxUsers === -1 ? '∞' : maxUsers}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-lg font-semibold text-gray-900">
                {(storageUsed / 1024).toFixed(1)} / {maxStorage} GB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentTier}
              onSelect={handleSelectPlan}
              loading={processing}
            />
          ))}
        </div>
      </div>

      {/* FAQ / Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>• All plans are billed monthly</p>
          <p>• You can upgrade or downgrade at any time</p>
          <p>• Prorated charges/credits will be applied when changing plans</p>
          <p>• Cancel anytime - no long-term contracts</p>
          <p>• Secure payment processing powered by Stripe</p>
        </div>
      </div>
    </div>
  )
}