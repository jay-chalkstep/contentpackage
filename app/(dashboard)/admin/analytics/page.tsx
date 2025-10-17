import ComingSoon from '@/components/ComingSoon'
import { Activity } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytics Dashboard"
      description="Track usage metrics, user activity, and organization insights. View detailed reports on logo usage, mockup creation, and team collaboration patterns."
      icon={<Activity className="h-8 w-8 text-[#374151]" />}
    />
  )
}