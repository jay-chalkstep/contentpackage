import Link from 'next/link';
import { Search, Palette, Upload, Library, Image } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Logo Finder & Design Tool</h1>
          <p className="text-xl text-gray-600">
            Search for logos, create mockups, and design assets - all in one simple tool.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/search" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <Search className="h-12 w-12 text-[#374151] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Logos</h3>
            <p className="text-gray-600 text-sm">Find logos from millions of brands using the Brandfetch API</p>
          </Link>

          <Link href="/library" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <Library className="h-12 w-12 text-[#374151] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Logo Library</h3>
            <p className="text-gray-600 text-sm">View and manage all your saved logos in one place</p>
          </Link>

          <Link href="/upload" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <Upload className="h-12 w-12 text-[#374151] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Logo</h3>
            <p className="text-gray-600 text-sm">Add your own custom logos to the library</p>
          </Link>

          <Link href="/card-designer" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <Palette className="h-12 w-12 text-[#374151] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Asset Designer</h3>
            <p className="text-gray-600 text-sm">Create mockups using your logos and templates</p>
          </Link>

          <Link href="/card-library" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <Image className="h-12 w-12 text-[#374151] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Templates</h3>
            <p className="text-gray-600 text-sm">Browse and manage card templates</p>
          </Link>

          <Link href="/mockup-library" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <Library className="h-12 w-12 text-[#374151] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Mockups</h3>
            <p className="text-gray-600 text-sm">View all your created mockups</p>
          </Link>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">1</span>
              <span>Search for a logo or upload your own</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">2</span>
              <span>Upload a card template or use existing ones</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">3</span>
              <span>Use the Asset Designer to create mockups</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#374151] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">4</span>
              <span>Save and export your designs</span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2024 Logo Finder - A Simple Design Tool</p>
        </div>
      </div>
    </div>
  );
}