import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { getCurrentUser } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.profile.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const stripeCustomerId = currentUser.organization?.stripe_customer_id

    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin/billing`,
    })

    return NextResponse.json({
      url: session.url,
    })

  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
