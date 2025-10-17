import DashboardLayoutAuth from '@/app/dashboard-layout-auth'

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutAuth>{children}</DashboardLayoutAuth>
}