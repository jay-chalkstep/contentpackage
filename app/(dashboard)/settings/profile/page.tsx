import ComingSoon from '@/components/ComingSoon'
import { User } from 'lucide-react'

export default function ProfileSettingsPage() {
  return (
    <ComingSoon
      title="Profile Settings"
      description="Update your personal information, change your password, and manage your account preferences."
      icon={<User className="h-8 w-8 text-[#374151]" />}
    />
  )
}