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
  Zap,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
} from 'lucide-react';
import { useSidebar } from '@/lib/contexts/SidebarContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation: NavigationItem[] = [
  { name: 'Search & Library', href: '/search', icon: Search },
  { name: 'Upload Logo', href: '/upload', icon: Upload },
  { name: 'Asset Designer', href: '/card-designer', icon: Palette },
  { name: 'Template Library', href: '/card-library', icon: Layers },
  { name: 'Upload Template', href: '/card-upload', icon: Image },
  { name: 'Mockup Library', href: '/mockup-library', icon: Library },
  // { name: 'API Test', href: '/test-brandfetch', icon: Zap },
];

const adminNavigation: NavigationItem[] = [
  { name: 'User Management', href: '/admin/users', icon: Users },
];

export default function SidebarSimple({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { membership } = useOrganization();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Check if user is an admin in the current organization
  const isAdmin = membership?.role === 'org:admin';

  // Collapse accordion when sidebar is collapsed
  const showAccordionContent = isAccordionOpen && !isCollapsed;

  return (
    <div
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-[#374151] h-screen flex flex-col overflow-y-auto
        fixed inset-y-0 left-0 z-50
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

        {/* Toggle button for desktop */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {!isCollapsed && (
          <Link href="/" className="block hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-white">Aiproval</h1>
            <p className="text-sm text-gray-400 mt-1">Collaborate and Validate</p>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-4 transition-all duration-300`}>
        {!isCollapsed && (
          <>
            {/* Accordion Header */}
            <button
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mb-2"
            >
              <span className="font-semibold">Aiproval</span>
              <ChevronDown
                size={20}
                className={`transition-transform duration-200 ${
                  isAccordionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapsible Navigation Items */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isAccordionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                          ${isActive
                            ? 'bg-white text-[#374151]'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }
                        `}
                      >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* Collapsed mode: Show all navigation items as icons only */}
        {isCollapsed && (
          <ul className="space-y-1">
            {navigation.map((item) => {
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
        )}

        {/* My Reviews - Top Level Navigation */}
        <div className="pt-2 border-t border-gray-600">
          {isCollapsed ? (
            <div className="relative group">
              <Link
                href="/reviews"
                onClick={onClose}
                className={`
                  flex items-center justify-center p-3 rounded-lg transition-colors
                  ${pathname === '/reviews'
                    ? 'bg-white text-[#374151]'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                title="My Reviews"
              >
                <MessageSquare size={20} />
              </Link>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50">
                My Reviews
              </div>
            </div>
          ) : (
            <Link
              href="/reviews"
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${pathname === '/reviews'
                  ? 'bg-white text-[#374151]'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <MessageSquare size={20} />
              <span>My Reviews</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Admin Section */}
      <div className={`border-t border-gray-600 ${isCollapsed ? 'p-2' : 'p-4'} space-y-4 transition-all duration-300`}>
        {/* Section Label - only show when expanded */}
        {!isCollapsed && (
          <div className="px-4">
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
                      flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors
                      ${isActive
                        ? 'bg-white text-[#374151]'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && <span>{item.name}</span>}
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