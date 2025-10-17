export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  maxUsers: number
  storageGB: number
  stripePriceId?: string
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    maxUsers: 5,
    storageGB: 10,
    features: [
      'Up to 5 team members',
      '10GB storage',
      'Unlimited logos & templates',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    interval: 'month',
    maxUsers: 25,
    storageGB: 100,
    popular: true,
    features: [
      'Up to 25 team members',
      '100GB storage',
      'Unlimited logos & templates',
      'Advanced analytics',
      'Priority email support',
      'Custom branding',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    maxUsers: -1, // unlimited
    storageGB: 500,
    features: [
      'Unlimited team members',
      '500GB storage',
      'Unlimited everything',
      'Advanced analytics & reports',
      'Dedicated support',
      'Custom branding',
      'API access',
      'SSO / SAML',
      'Custom integrations',
    ],
  },
]

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId)
}

export function getPlanByMaxUsers(maxUsers: number): SubscriptionPlan {
  if (maxUsers === -1) {
    return SUBSCRIPTION_PLANS[2] // enterprise
  } else if (maxUsers <= 5) {
    return SUBSCRIPTION_PLANS[0] // starter
  } else if (maxUsers <= 25) {
    return SUBSCRIPTION_PLANS[1] // professional
  }
  return SUBSCRIPTION_PLANS[2] // enterprise for anything larger
}
