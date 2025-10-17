'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Library,
  Home,
  Palette,
  Layers,
  MessageSquare,
  FileCheck,
  GitBranch,
  CheckCircle,
  Clock,
  FileSignature,
  Award
} from 'lucide-react';
import { clsx } from 'clsx';

// Asset Creation Section
const assetCreationNav = [
  { name: 'Logo Search', href: '/search', icon: Search },
  { name: 'Logo Library', href: '/library', icon: Library },
  { name: 'Asset Designer', href: '/card-designer', icon: Palette },
  { name: 'Asset Templates', href: '/card-library', icon: Layers },
];

// Markup & Collaboration Section
const markupCollabNav = [
  { name: 'Review Dashboard', href: '/reviews', icon: FileCheck },
  { name: 'Active Reviews', href: '/reviews/active', icon: MessageSquare },
  { name: 'Version History', href: '/reviews/versions', icon: GitBranch },
];

// Approval Management Section
const approvalManagementNav = [
  { name: 'Pending Approvals', href: '/approvals', icon: Clock },
  { name: 'Approval Workflows', href: '/approvals/workflows', icon: CheckCircle },
  { name: 'Approval History', href: '/approvals/history', icon: FileSignature },
  { name: 'Certificates', href: '/approvals/certificates', icon: Award },
];

export default function Sidebar() {
  const pathname = usePathname();

  const renderNavSection = (items: typeof assetCreationNav) => {
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
      </nav>
    </div>
  );
}