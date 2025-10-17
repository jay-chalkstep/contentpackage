import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase-types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Types for our auth system
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

export interface OrganizationInvitation {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'user'
  invited_by: string
  token: string
  expires_at: string
  accepted_at?: string
  created_at: string
}

export interface AuthSession {
  user: {
    id: string
    email: string
  }
  profile?: UserProfile
  organization?: Organization
}

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    max_users: 3,
    max_storage_mb: 500,
    features: [
      'Up to 3 team members',
      '500 MB storage',
      'Basic logo management',
      '10 mockups per month',
      'Community support'
    ]
  },
  starter: {
    name: 'Starter',
    price_monthly: 29,
    max_users: 10,
    max_storage_mb: 5000,
    features: [
      'Up to 10 team members',
      '5 GB storage',
      'Unlimited mockups',
      'Company asset library',
      'Email support',
      'Analytics dashboard'
    ]
  },
  professional: {
    name: 'Professional',
    price_monthly: 99,
    max_users: 50,
    max_storage_mb: 50000,
    features: [
      'Up to 50 team members',
      '50 GB storage',
      'Unlimited mockups',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price_monthly: 'custom',
    max_users: -1, // unlimited
    max_storage_mb: -1, // unlimited
    features: [
      'Unlimited team members',
      'Unlimited storage',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      '24/7 phone support',
      'On-premise deployment option'
    ]
  }
}