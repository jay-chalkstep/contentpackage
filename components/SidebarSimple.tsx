'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Library,
  Upload,
  Palette,
  Image,
  Layers,
  Zap,
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

export default function SidebarSimple() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#374151] min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-600">
        <h1 className="text-xl font-bold text-white">Asset Studio</h1>
        <p className="text-sm text-gray-400 mt-1">Logo Search • Mockup Creator</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
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
      </nav>
    </div>
  );
}