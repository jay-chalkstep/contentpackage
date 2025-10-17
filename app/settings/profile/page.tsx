import DashboardLayoutAuth from '@/app/dashboard-layout-auth'
import ComingSoon from '@/components/ComingSoon'
import { User } from 'lucide-react'

export default function ProfileSettingsPage() {
  return (
    <DashboardLayoutAuth>
      <ComingSoon
        title="Profile Settings"
        description="Update your personal information, change your password, and manage your account preferences."
        icon={<User className="h-8 w-8 text-blue-600" />}
      />
    </DashboardLayoutAuth>
  )
}