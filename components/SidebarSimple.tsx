'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrganizationSwitcher, useOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import {
  Search,
  Library,
  Upload,
  Palette,
  Image,
  Layers,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Briefcase,
  Workflow,
} from 'lucide-react';
import { useSidebar } from '@/lib/contexts/SidebarContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Grouped navigation structure
const navigationGroups: NavigationGroup[] = [
  {
    label: 'Brand Assets',
    items: [
      { name: 'Logo Library', href: '/search', icon: Search },
      { name: 'Upload Logo', href: '/upload', icon: Upload },
      { name: 'Template Library', href: '/card-library', icon: Layers },
      { name: 'Upload Template', href: '/card-upload', icon: Image },
    ],
  },
  {
    label: 'Mockups',
    items: [
      { name: 'Designer', href: '/card-designer', icon: Palette },
      { name: 'Library', href: '/mockup-library', icon: Library },
      { name: 'Projects', href: '/projects', icon: Briefcase },
    ],
  },
  {
    label: 'Approvals',
    items: [
      { name: 'My Reviews', href: '/my-stage-reviews', icon: MessageSquare },
    ],
  },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Workflows', href: '/admin/workflows', icon: Workflow },
  { name: 'User Management', href: '/admin/users', icon: Users },
];

export default function SidebarSimple({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { membership } = useOrganization();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Brand Assets': true,
    'Mockups': true,
    'Approvals': true,
  });

  // Check if user is an admin in the current organization
  const isAdmin = membership?.role === 'org:admin';

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-[#374151] flex flex-col overflow-y-auto
        fixed left-0 z-40
        top-[73px] h-[calc(100vh-73px)]
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-600 relative transition-all duration-300`}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {isCollapsed ? (
          /* Collapsed state: Just the chevron toggle */
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight size={20} />
          </button>
        ) : (
          /* Expanded state: Branding with integrated chevron */
          <div className="hidden lg:block">
            {/* Branding and toggle row */}
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold text-white">Aiproval</h1>
              </Link>
              <button
                onClick={toggleCollapsed}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            {/* Tagline */}
            <Link href="/" className="block hover:opacity-80 transition-opacity">
              <p className="text-sm text-gray-400">Collaborate and Validate</p>
            </Link>
          </div>
        )}

        {/* Mobile: Always show branding */}
        <div className="lg:hidden">
          <Link href="/" className="block hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-white">Aiproval</h1>
            <p className="text-sm text-gray-400 mt-1">Collaborate and Validate</p>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-2 transition-all duration-300`}>
        {isCollapsed ? (
          /* Collapsed mode: Show all items as icons only */
          <ul className="space-y-1">
            {navigationGroups.flatMap(group => group.items).map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name} className="relative group">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center justify-center p-3 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-white text-[#374151]'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    title={item.name}
                  >
                    <item.icon size={20} />
                  </Link>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50">
                    {item.name}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          /* Expanded mode: Show grouped navigation */
          <>
            {navigationGroups.map((group) => (
              <div key={group.label} className="mb-4">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 py-2 text-gray-400 hover:text-white rounded-lg transition-colors group"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      expandedGroups[group.label] ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Group Items */}
                {expandedGroups[group.label] && (
                  <ul className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                              ${isActive
                                ? 'bg-white text-[#374151]'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              }
                            `}
                          >
                            <item.icon size={18} />
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Admin Section */}
      <div className={`border-t border-gray-600 ${isCollapsed ? 'p-2' : 'p-4'} space-y-4 transition-all duration-300`}>
        {/* Section Label - only show when expanded */}
        {!isCollapsed && (
          <div className="px-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Admin
            </h2>
          </div>
        )}

        {/* Organization Switcher */}
        <div className={isCollapsed ? 'px-0' : 'px-2'}>
          <OrganizationSwitcher
            appearance={{
              baseTheme: dark,
              elements: {
                rootBox: 'w-full',
                organizationSwitcherTrigger: isCollapsed
                  ? 'w-full p-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors flex items-center justify-center'
                  : 'w-full px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors',
                organizationSwitcherTriggerIcon: 'text-gray-300',
                organizationPreview: isCollapsed ? 'hidden' : 'text-gray-100',
                organizationPreviewAvatarBox: 'w-8 h-8',
                organizationPreviewMainIdentifier: isCollapsed ? 'hidden' : '',
                organizationPreviewSecondaryIdentifier: isCollapsed ? 'hidden' : '',
              },
            }}
          />
        </div>

        {/* Admin-only Links */}
        {isAdmin && (
          <ul className="space-y-1">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name} className={isCollapsed ? 'relative group' : ''}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'} rounded-lg transition-colors
                      ${isActive
                        ? 'bg-white text-[#374151]'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon size={18} />
                    {!isCollapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50">
                      {item.name}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
