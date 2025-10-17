'use client'

import { Check } from 'lucide-react'
import type { SubscriptionPlan } from '@/lib/stripe/plans'

interface PlanCardProps {
  plan: SubscriptionPlan
  currentPlan?: string
  onSelect: (planId: string) => void
  loading?: boolean
}

export default function PlanCard({ plan, currentPlan, onSelect, loading }: PlanCardProps) {
  const isCurrent = currentPlan === plan.id
  const isPopular = plan.popular

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border-2 p-8 ${
        isPopular
          ? 'border-[#374151] shadow-lg'
          : isCurrent
          ? 'border-green-500'
          : 'border-gray-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-[#374151] text-white">
            Most Popular
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500 text-white">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center">
          <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
          <span className="text-gray-500 ml-2">/{plan.interval}</span>
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        disabled={isCurrent || loading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          isCurrent
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isPopular
            ? 'bg-[#374151] text-white hover:bg-[#1f2937]'
            : 'bg-white text-[#374151] border-2 border-[#374151] hover:bg-gray-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isCurrent ? 'Current Plan' : loading ? 'Processing...' : `Upgrade to ${plan.name}`}
      </button>
    </div>
  )
}
