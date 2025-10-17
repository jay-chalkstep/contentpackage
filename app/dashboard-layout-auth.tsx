import { getCurrentUser } from '@/lib/auth/server';
import SidebarAuth from '@/components/SidebarAuth';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';
import { Bell } from 'lucide-react';

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
          <div className="flex items-center justify-end">
            {/* User menu and actions */}
            <div className="flex items-center space-x-4">
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