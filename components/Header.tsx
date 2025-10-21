'use client';

import { UserButton } from '@clerk/nextjs';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - App branding */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Asset Studio</h1>
          <p className="text-xs text-gray-500">Logo Search • Mockup Creator</p>
        </div>

        {/* Right side - User button */}
        <div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
                userButtonTrigger: 'focus:shadow-none',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
