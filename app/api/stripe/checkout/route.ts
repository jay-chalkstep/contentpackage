import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { getPlanById } from '@/lib/stripe/plans'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.profile.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { message: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json(
        { message: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get or create Stripe customer
    let stripeCustomerId = currentUser.organization?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: currentUser.profile.email,
        name: currentUser.organization?.name,
        metadata: {
          organization_id: currentUser.profile.organization_id,
        },
      })

      stripeCustomerId = customer.id

      // Save customer ID to database
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', currentUser.profile.organization_id)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `${plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} users, ${plan.storageGB}GB storage`,
            },
            unit_amount: plan.price * 100, // Convert to cents
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        organization_id: currentUser.profile.organization_id,
        plan_id: planId,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
