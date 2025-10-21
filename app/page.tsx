'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Palette, Upload, Library, Image, LayoutGrid, Menu } from 'lucide-react';
import SidebarSimple from '@/components/SidebarSimple';

export default function Home() {
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
        <div className="p-8 lg:p-8 pt-20 lg:pt-8 max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Asset Studio</h1>
            <p className="text-lg text-gray-600">
              Search for logos, create mockups, and design assets - all in one simple tool.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Link href="/search" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
              <div className="flex items-start gap-3">
                <Search className="h-8 w-8 text-[#374151] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Search & Library</h3>
                  <p className="text-gray-600 text-sm">Find logos from brands or browse your saved collection</p>
                </div>
              </div>
            </Link>

            <Link href="/upload" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
              <div className="flex items-start gap-3">
                <Upload className="h-8 w-8 text-[#374151] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Upload Logo</h3>
                  <p className="text-gray-600 text-sm">Add your own custom logos to the library</p>
                </div>
              </div>
            </Link>

            <Link href="/card-designer" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
              <div className="flex items-start gap-3">
                <Palette className="h-8 w-8 text-[#374151] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Asset Designer</h3>
                  <p className="text-gray-600 text-sm">Create mockups using your logos and templates</p>
                </div>
              </div>
            </Link>

            <Link href="/card-library" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
              <div className="flex items-start gap-3">
                <LayoutGrid className="h-8 w-8 text-[#374151] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Template Library</h3>
                  <p className="text-gray-600 text-sm">Browse and manage card templates</p>
                </div>
              </div>
            </Link>

            <Link href="/card-upload" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
              <div className="flex items-start gap-3">
                <Image className="h-8 w-8 text-[#374151] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Upload Template</h3>
                  <p className="text-gray-600 text-sm">Add your own custom templates</p>
                </div>
              </div>
            </Link>

            <Link href="/mockup-library" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
              <div className="flex items-start gap-3">
                <Library className="h-8 w-8 text-[#374151] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Mockups</h3>
                  <p className="text-gray-600 text-sm">View all your created mockups</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Start */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Quick Start</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">For Logo Work</h3>
                <ol className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Visit Search & Library to find or upload logos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Save your favorites to your personal library</span>
                  </li>
                </ol>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">For Mockup Design</h3>
                <ol className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Upload or use existing templates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Use Asset Designer to create and export mockups</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}