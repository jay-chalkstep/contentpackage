import { getCurrentUser } from '@/lib/auth/server';
import SidebarAuth from '@/components/SidebarAuth';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';
import { Bell, Plus } from 'lucide-react';

export default async function DashboardLayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarAuth />
      <div className="flex-1 flex flex-col">
        {/* Header Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Page title or breadcrumbs can go here */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                CDCO Content Creator
              </h1>
              {currentUser?.organization && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                  {currentUser.organization.name}
                </span>
              )}
            </div>

            {/* Right side - User menu and actions */}
            <div className="flex items-center space-x-4">
              {/* Quick Actions - Link to User Management where invite modal is */}
              {currentUser?.profile?.role === 'admin' && (
                <Link
                  href="/admin/users"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite User
                </Link>
              )}

              {/* Notifications (placeholder) */}
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Menu */}
              {currentUser && (
                <UserMenu
                  user={currentUser.session.user}
                  profile={currentUser.profile}
                  organization={currentUser.organization}
                />
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}