import DashboardLayoutAuth from '@/app/dashboard-layout-auth'
import ComingSoon from '@/components/ComingSoon'
import { Settings } from 'lucide-react'

export default function OrganizationSettingsPage() {
  return (
    <DashboardLayoutAuth>
      <ComingSoon
        title="Organization Settings"
        description="Configure your organization's branding, manage default settings, and control team permissions."
        icon={<Settings className="h-8 w-8 text-[#374151]" />}
      />
    </DashboardLayoutAuth>
  )
}