'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/config';
import {
  Search,
  Library,
  Home,
  Upload,
  CreditCard,
  Layers,
  Palette,
  Image,
  Users,
  Settings,
  Activity,
  Shield
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  // Logo management - Available to all users
  { name: 'Logo Search', href: '/search', icon: Search },
  { name: 'Logo Upload', href: '/upload', icon: Upload },
  { name: 'Logo Library', href: '/library', icon: Library },
  // Asset template management - Available to all users
  { name: 'Asset Upload', href: '/card-upload', icon: CreditCard },
  { name: 'Asset Library', href: '/card-library', icon: Layers },
  // Design tools - Available to all users
  { name: 'Asset Designer', href: '/card-designer', icon: Palette },
  { name: 'Mockup Library', href: '/mockup-library', icon: Image },
];

const adminNavigation: NavigationItem[] = [
  { name: 'User Management', href: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Analytics', href: '/admin/analytics', icon: Activity, adminOnly: true },
  { name: 'Settings', href: '/settings/organization', icon: Settings, adminOnly: true },
];

export default function SidebarAuth() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          setUserRole(profile?.role || 'user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserRole();
  }, []);

  const isAdmin = userRole === 'admin';

  // Combine navigation items based on role
  const allNavigation = [
    ...navigation,
    ...(isAdmin ? adminNavigation : [])
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-[#374151]">
      <div className="flex h-16 items-center px-6 bg-[#1f2937]">
        <h1 className="text-xl font-semibold text-white">Approval Orbit</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Main Navigation */}
        <div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-white'
                      : 'text-white/70 group-hover:text-white'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-white/20" />
            <div className="px-3 mb-2">
              <div className="flex items-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </div>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-white'
                        : 'text-white/70 group-hover:text-white'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Role Indicator at Bottom */}
      {!isLoading && (
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center text-xs text-white/60">
            <Shield className="h-3 w-3 mr-1" />
            {isAdmin ? 'Administrator' : 'Team Member'}
          </div>
        </div>
      )}
    </div>
  );
}