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
  Settings,
  Users,
  ChevronDown,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
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
  { name: 'Organization Settings', href: '/admin/settings', icon: Settings },
];

export default function SidebarSimple() {
  const pathname = usePathname();
  const { membership } = useOrganization();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Check if user is an admin in the current organization
  const isAdmin = membership?.role === 'org:admin';

  return (
    <div className="w-64 bg-[#374151] min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-600">
        <h1 className="text-xl font-bold text-white">Asset Studio</h1>
        <p className="text-sm text-gray-400 mt-1">Logo Search • Mockup Creator</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {/* Accordion Header */}
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mb-2"
        >
          <span className="font-semibold">Asset Studio</span>
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
      </nav>

      {/* Admin Section */}
      <div className="border-t border-gray-600 p-4 space-y-4">
        {/* Section Label */}
        <div className="px-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Admin
          </h2>
        </div>

        {/* Organization Switcher */}
        <div className="px-2">
          <OrganizationSwitcher
            appearance={{
              baseTheme: dark,
              elements: {
                rootBox: 'w-full',
                organizationSwitcherTrigger:
                  'w-full px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors',
                organizationSwitcherTriggerIcon: 'text-gray-300',
                organizationPreview: 'text-gray-100',
                organizationPreviewAvatarBox: 'w-8 h-8',
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
                <li key={item.name}>
                  <Link
                    href={item.href}
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
        )}
      </div>
    </div>
  );
}