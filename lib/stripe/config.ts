import Stripe from 'stripe'

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin/billing?success=true`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin/billing?canceled=true`,
}
