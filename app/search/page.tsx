'use client';

import { useState } from 'react';
import DashboardLayout from '../dashboard-layout';
import LogoCard from '@/components/LogoCard';
import Toast from '@/components/Toast';
import { Search, Loader2 } from 'lucide-react';

interface BrandLogo {
  type: string;
  theme?: string;
  formats: Array<{
    src: string;
    background?: string;
    format: string;
    height?: number;
    width?: number;
    size?: number;
  }>;
}

interface BrandData {
  name: string;
  domain: string;
  description?: string;
  logos: BrandLogo[];
  colors?: Array<{
    hex: string;
    type: string;
    brightness?: number;
  }>;
  fonts?: Array<{
    name: string;
    type: string;
    origin?: string;
  }>;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const searchBrand = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setBrandData(null);

    try {
      // Clean the search query - it can be a domain or company name
      const cleanQuery = searchQuery.trim().toLowerCase().replace(/https?:\/\//, '').replace(/www\./, '');

      const response = await fetch(`/api/brandfetch?domain=${encodeURIComponent(cleanQuery)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch brand data');
      }

      const data = await response.json();
      setBrandData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchBrand();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Search Logos</h2>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter company domain (e.g., apple.com) or name..."
              className="w-full px-4 py-3 pl-12 pr-32 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <button
              onClick={searchBrand}
              disabled={loading || !searchQuery.trim()}
              className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Brand Results */}
        {brandData && (
          <div className="space-y-6">
            {/* Brand Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {brandData.name}
              </h3>
              <p className="text-gray-600 mb-2">{brandData.domain}</p>
              {brandData.description && (
                <p className="text-gray-500 text-sm">{brandData.description}</p>
              )}
            </div>

            {/* Logos Grid - Organized by Type */}
            <div className="space-y-8">
              {brandData.logos.map((logoGroup, groupIdx) => (
                <div key={groupIdx} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {logoGroup.type} Logos {logoGroup.theme && `- ${logoGroup.theme} theme`}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {logoGroup.formats.map((format, formatIdx) => (
                      <LogoCard
                        key={`${groupIdx}-${formatIdx}`}
                        logoUrl={format.src}
                        format={format.format}
                        type={logoGroup.type}
                        theme={logoGroup.theme}
                        width={format.width}
                        height={format.height}
                        size={format.size}
                        background={format.background}
                        companyName={brandData.name}
                        domain={brandData.domain}
                        brandColors={brandData.colors}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Brand Colors */}
            {brandData.colors && brandData.colors.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Brand Colors
                </h3>
                <div className="flex flex-wrap gap-4">
                  {brandData.colors.map((color, idx) => (
                    <div key={idx} className="group">
                      <div
                        className="w-20 h-20 rounded-lg shadow-md mb-2 cursor-pointer transition-transform hover:scale-105"
                        style={{ backgroundColor: color.hex }}
                        onClick={() => {
                          navigator.clipboard.writeText(color.hex);
                          showToast(`Copied ${color.hex}`, 'success');
                        }}
                        title="Click to copy"
                      ></div>
                      <p className="text-xs font-medium text-gray-700 text-center">
                        {color.hex}
                      </p>
                      <p className="text-xs text-gray-500 capitalize text-center">
                        {color.type}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">Click any color to copy its hex code</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !brandData && !error && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for company logos</h3>
            <p className="text-gray-500">
              Enter a company domain or name to find their logos
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => { setSearchQuery('apple.com'); searchBrand(); }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Try Apple
              </button>
              <button
                onClick={() => { setSearchQuery('nike.com'); searchBrand(); }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Try Nike
              </button>
              <button
                onClick={() => { setSearchQuery('spotify.com'); searchBrand(); }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Try Spotify
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </DashboardLayout>
  );
}