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
  Award,
  ChevronDown,
  ChevronUp
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
  { name: 'Mockup Library', href: '/mockup-library', icon: Image },
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
  const supabase = createClient();

  // Initialize with null to match server render
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Collapsible sections state - default to all expanded
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    assetCreation: false,
    markupCollab: false,
    approvalManagement: false,
    admin: false,
  });
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Load both collapsed state AND cached role after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);

    // Load collapsed sections
    const saved = localStorage.getItem('sidebarCollapsedSections');
    if (saved) {
      try {
        setCollapsedSections(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading sidebar state:', error);
      }
    }

    // Load cached role
    const cachedRole = localStorage.getItem('userRole');
    if (cachedRole) {
      setUserRole(cachedRole);
    }

    setHasLoadedFromStorage(true);
  }, []);

  // Save collapse state to localStorage whenever it changes (but not on initial mount)
  useEffect(() => {
    if (hasLoadedFromStorage) {
      localStorage.setItem('sidebarCollapsedSections', JSON.stringify(collapsedSections));
    }
  }, [collapsedSections, hasLoadedFromStorage]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

          const role = profile?.role || 'user';
          setUserRole(role);
          // Cache the role in localStorage for immediate access on next load
          localStorage.setItem('userRole', role);
        } else {
          // Clear cached role if no user
          setUserRole(null);
          localStorage.removeItem('userRole');
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
          <button
            onClick={() => toggleSection('assetCreation')}
            className="w-full px-3 mb-2 mt-4 flex items-center justify-between text-xs font-semibold text-white/60 hover:text-white/80 uppercase tracking-wider transition-colors"
          >
            <div className="flex items-center">
              <Palette className="h-3 w-3 mr-1" />
              Asset Creation
            </div>
            {collapsedSections.assetCreation ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
          {!collapsedSections.assetCreation && (
            <div className="space-y-1">
              {renderNavSection(assetCreationNav)}
            </div>
          )}
        </div>

        {/* Markup & Collaboration Section */}
        <div className="mb-4">
          <div className="my-4 border-t border-white/20" />
          <button
            onClick={() => toggleSection('markupCollab')}
            className="w-full px-3 mb-2 flex items-center justify-between text-xs font-semibold text-white/60 hover:text-white/80 uppercase tracking-wider transition-colors"
          >
            <div className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              Markup & Collaboration
            </div>
            {collapsedSections.markupCollab ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
          {!collapsedSections.markupCollab && (
            <div className="space-y-1">
              {renderNavSection(markupCollabNav)}
            </div>
          )}
        </div>

        {/* Approval Management Section */}
        <div className="mb-4">
          <div className="my-4 border-t border-white/20" />
          <button
            onClick={() => toggleSection('approvalManagement')}
            className="w-full px-3 mb-2 flex items-center justify-between text-xs font-semibold text-white/60 hover:text-white/80 uppercase tracking-wider transition-colors"
          >
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approval Management
            </div>
            {collapsedSections.approvalManagement ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
          {!collapsedSections.approvalManagement && (
            <div className="space-y-1">
              {renderNavSection(approvalManagementNav)}
            </div>
          )}
        </div>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <div className="mb-4">
            <div className="my-4 border-t border-white/20" />
            <button
              onClick={() => toggleSection('admin')}
              className="w-full px-3 mb-2 flex items-center justify-between text-xs font-semibold text-white/60 hover:text-white/80 uppercase tracking-wider transition-colors"
            >
              <div className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </div>
              {collapsedSections.admin ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </button>
            {!collapsedSections.admin && (
              <div className="space-y-1">
                {renderNavSection(adminNavigation)}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}