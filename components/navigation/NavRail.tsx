'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrganizationSwitcher, UserButton, useOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import {
  Library,
  Search,
  Palette,
  MessageSquare,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Users,
} from 'lucide-react';
import { usePanelContext } from '@/lib/contexts/PanelContext';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'library', name: 'Library', href: '/mockup-library', icon: Library },
  { id: 'search', name: 'Search', href: '/search', icon: Search },
  { id: 'design', name: 'Design', href: '/card-designer', icon: Palette },
  { id: 'reviews', name: 'Reviews', href: '/my-stage-reviews', icon: MessageSquare },
  { id: 'projects', name: 'Projects', href: '/projects', icon: Briefcase },
];

const adminNavItems: NavItem[] = [
  { id: 'workflows', name: 'Workflows', href: '/admin/workflows', icon: Workflow },
  { id: 'users', name: 'Users', href: '/admin/users', icon: Users },
];

export default function NavRail() {
  const pathname = usePathname();
  const { membership } = useOrganization();
  const { navExpanded, setNavExpanded, setActiveNav } = usePanelContext();
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = membership?.role === 'org:admin';
  const isExpanded = navExpanded || hoverExpanded;

  // Handle mouse enter with 200ms delay
  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverExpanded(true);
    }, 200);
  };

  // Handle mouse leave - clear timeout and collapse
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoverExpanded(false);
  };

  // Toggle permanent expansion
  const toggleExpanded = () => {
    setNavExpanded(!navExpanded);
  };

  // Update active nav based on current path
  useEffect(() => {
    const activeItem = navItems.find(item => pathname?.startsWith(item.href));
    if (activeItem) {
      setActiveNav(activeItem.id);
    }
  }, [pathname, setActiveNav]);

  return (
    <div
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-[var(--border-main)]
        flex flex-col transition-all duration-300 ease-in-out z-50
        ${isExpanded ? 'w-[var(--nav-expanded)]' : 'w-[var(--nav-width)]'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'active-nav'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }
                    ${isExpanded ? '' : 'justify-center'}
                  `}
                  title={isExpanded ? '' : item.name}
                >
                  <item.icon size={24} className="flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-6">
            {isExpanded && (
              <div className="px-4 mb-2">
                <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Admin
                </span>
              </div>
            )}
            <ul className="space-y-1 px-2">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                        ${isActive
                          ? 'active-nav'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                        }
                        ${isExpanded ? '' : 'justify-center'}
                      `}
                      title={isExpanded ? '' : item.name}
                    >
                      <item.icon size={24} className="flex-shrink-0" />
                      {isExpanded && (
                        <span className="text-sm font-medium whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[var(--border-main)] p-3 space-y-3">
        {/* Expand/Collapse Toggle */}
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          title={navExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {navExpanded ? (
            <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
          ) : (
            <ChevronRight size={20} className="text-[var(--text-secondary)]" />
          )}
        </button>

        {/* Organization Switcher */}
        <div className={isExpanded ? '' : 'flex justify-center'}>
          <OrganizationSwitcher
            appearance={{
              baseTheme: dark,
              elements: {
                rootBox: isExpanded ? 'w-full' : 'w-10',
                organizationSwitcherTrigger: isExpanded
                  ? 'w-full px-3 py-2 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors'
                  : 'w-10 h-10 p-0 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center',
                organizationSwitcherTriggerIcon: 'text-[var(--text-secondary)]',
                organizationPreview: isExpanded ? 'text-[var(--text-primary)]' : 'hidden',
                organizationPreviewAvatarBox: 'w-8 h-8',
                organizationPreviewMainIdentifier: isExpanded ? '' : 'hidden',
                organizationPreviewSecondaryIdentifier: 'hidden',
              },
            }}
          />
        </div>

        {/* User Button */}
        <div className={`${isExpanded ? '' : 'flex justify-center'}`}>
          <UserButton
            showName={isExpanded}
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
                userButtonTrigger: 'focus:shadow-none hover:opacity-80 transition-opacity',
                userButtonOuterIdentifier: isExpanded ? 'text-[var(--text-primary)] font-medium text-sm' : 'hidden',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
