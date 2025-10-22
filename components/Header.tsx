'use client';

import { UserButton } from '@clerk/nextjs';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left side - Menu button + App branding */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 bg-[#374151] text-white rounded-lg shadow-sm hover:bg-[#1f2937] transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}

          <div>
            <h1 className="text-xl font-bold text-gray-900">Asset Studio</h1>
            <p className="hidden sm:block text-xs text-gray-500">Logo Search • Mockup Creator</p>
          </div>
        </div>

        {/* Right side - User button with name */}
        <div>
          <UserButton
            showName
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
                userButtonTrigger: 'focus:shadow-none',
                userButtonOuterIdentifier: 'text-gray-900 font-medium',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
