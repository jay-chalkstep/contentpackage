'use client';

import { useState } from 'react';
import SidebarSimple from '@/components/SidebarSimple';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-[#374151] text-white rounded-lg shadow-lg hover:bg-[#1f2937] transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop for mobile */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SidebarSimple
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="p-8 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
