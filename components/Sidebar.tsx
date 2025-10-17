'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Library, Home, Upload, CreditCard, Layers, Palette, Image } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  // Logo management
  { name: 'Logo Search', href: '/search', icon: Search },
  { name: 'Logo Upload', href: '/upload', icon: Upload },
  { name: 'Logo Library', href: '/library', icon: Library },
  // Card template management
  { name: 'Card Upload', href: '/card-upload', icon: CreditCard },
  { name: 'Card Library', href: '/card-library', icon: Layers },
  // Design tools
  { name: 'Card Designer', href: '/card-designer', icon: Palette },
  { name: 'Mockup Library', href: '/mockup-library', icon: Image },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-[#0453f8]">
      <div className="flex h-16 items-center px-6 bg-[#0342c7]">
        <h1 className="text-xl font-semibold text-white">CDCO Content Creator</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
      </nav>
    </div>
  );
}