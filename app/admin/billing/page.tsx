import DashboardLayoutAuth from '@/app/dashboard-layout-auth'
import ComingSoon from '@/components/ComingSoon'
import { CreditCard } from 'lucide-react'

export default function BillingPage() {
  return (
    <DashboardLayoutAuth>
      <ComingSoon
        title="Billing & Subscription"
        description="Manage your subscription plan, payment methods, and billing history. View invoices and upgrade to unlock more features."
        icon={<CreditCard className="h-8 w-8 text-[#374151]" />}
      />
    </DashboardLayoutAuth>
  )
}