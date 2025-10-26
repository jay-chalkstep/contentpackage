'use client';

import { useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  Menu,
  Command,
  Bell,
  Sparkles,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import AIGlobalSearch from '@/components/search/AIGlobalSearch';

export default function AppHeader() {
  const { visibility, setVisibility } = usePanelContext();
  const { user } = useUser();
  const [notificationCount] = useState(3); // TODO: Connect to real notification system

  const handleToggleNav = () => {
    // Toggle Context Panel visibility instead of NavRail
    setVisibility({ context: !visibility.context });
  };

  const handleCommandPalette = () => {
    // TODO: Open command palette modal
    console.log('Command palette opened');
  };

  const handleNotifications = () => {
    // TODO: Open notifications panel
    console.log('Notifications opened');
  };

  const handleAIAssistant = () => {
    // TODO: Toggle AI assistant panel
    console.log('AI assistant toggled');
  };

  const handleSettings = () => {
    // TODO: Open settings menu
    console.log('Settings opened');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[var(--border-main)] z-50 flex items-center px-4 gap-4">
      {/* Left Section - Menu + Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleToggleNav}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Toggle navigation"
          title="Toggle navigation"
        >
          <Menu size={20} className="text-[var(--text-icon)]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)] hidden sm:inline">
            Aiproval
          </span>
        </div>
      </div>

      {/* Center Section - Global Search */}
      <div className="flex-1 max-w-2xl mx-auto">
        <AIGlobalSearch />
      </div>

      {/* Right Section - Tools + User */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Command Palette */}
        <button
          onClick={handleCommandPalette}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          title="Command palette"
        >
          <Command size={16} className="text-[var(--text-icon)]" />
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-main)] rounded">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={handleNotifications}
          className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          title="Notifications"
        >
          <Bell size={20} className="text-[var(--text-icon)]" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* AI Assistant */}
        <button
          onClick={handleAIAssistant}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          title="AI Assistant"
        >
          <Sparkles size={20} className="text-[var(--accent-purple)]" />
        </button>

        {/* Settings/Help Dropdown */}
        <div className="relative group">
          <button
            onClick={handleSettings}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            title="Settings & Help"
          >
            <Settings size={20} className="text-[var(--text-icon)]" />
          </button>

          {/* Dropdown Menu - TODO: Make this functional */}
          <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[var(--border-main)] py-1">
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
              <Settings size={16} />
              Settings
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
              <HelpCircle size={16} />
              Help & Support
            </button>
          </div>
        </div>

        {/* User Button with Name */}
        <div className="ml-2 flex items-center gap-2">
          {user && (
            <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">
              {user.firstName || user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0]}
            </span>
          )}
          <UserButton
            showName={false}
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
                userButtonTrigger: 'focus:shadow-none hover:opacity-80 transition-opacity',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
