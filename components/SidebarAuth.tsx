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
  Shield,
  MessageSquare,
  FileCheck,
  GitBranch,
  CheckCircle,
  Clock,
  FileSignature,
  Award
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

// Asset Creation Section
const assetCreationNav: NavigationItem[] = [
  { name: 'Logo Search', href: '/search', icon: Search },
  { name: 'Logo Library', href: '/library', icon: Library },
  { name: 'Asset Designer', href: '/card-designer', icon: Palette },
  { name: 'Asset Templates', href: '/card-library', icon: Layers },
];

// Markup & Collaboration Section
const markupCollabNav: NavigationItem[] = [
  { name: 'Review Dashboard', href: '/reviews', icon: FileCheck },
  { name: 'Active Reviews', href: '/reviews/active', icon: MessageSquare },
  { name: 'Version History', href: '/reviews/versions', icon: GitBranch },
];

// Approval Management Section
const approvalManagementNav: NavigationItem[] = [
  { name: 'Pending Approvals', href: '/approvals', icon: Clock },
  { name: 'Approval Workflows', href: '/approvals/workflows', icon: CheckCircle },
  { name: 'Approval History', href: '/approvals/history', icon: FileSignature },
  { name: 'Certificates', href: '/approvals/certificates', icon: Award },
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

  const renderNavSection = (items: NavigationItem[]) => {
    return items.map((item) => {
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
    });
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-[#374151]">
      <div className="flex h-16 items-center px-6 bg-[#1f2937]">
        <Link href="/">
          <h1 className="text-xl font-semibold text-white cursor-pointer hover:text-gray-200 transition-colors">
            Approval Orbit
          </h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Home */}
        <Link
          href="/"
          className={clsx(
            'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mb-2',
            pathname === '/'
              ? 'bg-white/20 text-white'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          )}
        >
          <Home
            className={clsx(
              'mr-3 h-5 w-5 flex-shrink-0',
              pathname === '/'
                ? 'text-white'
                : 'text-white/70 group-hover:text-white'
            )}
            aria-hidden="true"
          />
          Home
        </Link>

        {/* Asset Creation Section */}
        <div className="mb-4">
          <div className="px-3 mb-2 mt-4">
            <div className="flex items-center text-xs font-semibold text-white/60 uppercase tracking-wider">
              <Palette className="h-3 w-3 mr-1" />
              Asset Creation
            </div>
          </div>
          {renderNavSection(assetCreationNav)}
        </div>

        {/* Markup & Collaboration Section */}
        <div className="mb-4">
          <div className="my-4 border-t border-white/20" />
          <div className="px-3 mb-2">
            <div className="flex items-center text-xs font-semibold text-white/60 uppercase tracking-wider">
              <MessageSquare className="h-3 w-3 mr-1" />
              Markup & Collaboration
            </div>
          </div>
          {renderNavSection(markupCollabNav)}
        </div>

        {/* Approval Management Section */}
        <div className="mb-4">
          <div className="my-4 border-t border-white/20" />
          <div className="px-3 mb-2">
            <div className="flex items-center text-xs font-semibold text-white/60 uppercase tracking-wider">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approval Management
            </div>
          </div>
          {renderNavSection(approvalManagementNav)}
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
            {renderNavSection(adminNavigation)}
          </>
        )}
      </nav>
    </div>
  );
}