'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard-layout';
import { Trash2, Download, ExternalLink, Search, Filter } from 'lucide-react';
import { supabase, Logo } from '@/lib/supabase';

export default function LibraryPage() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [filteredLogos, setFilteredLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchLogos();
  }, []);

  useEffect(() => {
    filterLogos();
  }, [searchQuery, filterType, logos]);

  const fetchLogos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogos(data || []);
    } catch (error) {
      console.error('Error fetching logos:', error);
      alert('Failed to fetch logos');
    } finally {
      setLoading(false);
    }
  };

  const filterLogos = () => {
    let filtered = [...logos];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (logo) =>
          logo.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          logo.domain?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((logo) => logo.logo_type === filterType);
    }

    setFilteredLogos(filtered);
  };

  const deleteLogo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    try {
      const { error } = await supabase.from('logos').delete().eq('id', id);

      if (error) throw error;

      setLogos(logos.filter((logo) => logo.id !== id));
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Failed to delete logo');
    }
  };

  const downloadLogo = async (url: string, companyName: string, format: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${companyName.replace(/\s+/g, '_')}_logo.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading logo:', error);
      alert('Failed to download logo');
    }
  };

  const uniqueTypes = Array.from(new Set(logos.map((logo) => logo.logo_type).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Logo Library</h2>
          <p className="text-gray-600">
            Your saved company logos ({filteredLogos.length} logos)
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name or domain..."
                className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#374151]"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#374151]"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading logos...</div>
          </div>
        ) : filteredLogos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">
              {searchQuery || filterType !== 'all'
                ? 'No logos found matching your filters.'
                : 'No logos saved yet. Start by searching for company logos!'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <a
                href="/search"
                className="inline-block px-4 py-2 bg-[#374151] text-white rounded-md hover:bg-[#1f2937] transition-colors"
              >
                Search Logos
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredLogos.map((logo) => (
              <div
                key={logo.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {/* Logo Preview */}
                <div className="relative p-6 bg-gray-50 rounded-t-lg">
                  {/* Uploaded Badge */}
                  {logo.is_uploaded && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                      Uploaded
                    </div>
                  )}
                  <div
                    className="h-32 flex items-center justify-center"
                    style={{
                      backgroundColor: logo.background_color || 'transparent',
                    }}
                  >
                    <img
                      src={logo.logo_url}
                      alt={`${logo.company_name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Logo Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {logo.company_name}
                  </h3>
                  {logo.domain && (
                    <p className="text-sm text-gray-500 mb-2">{logo.domain}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    {logo.logo_type && (
                      <span className="px-2 py-1 bg-gray-100 rounded uppercase">
                        {logo.logo_type}
                      </span>
                    )}
                    {logo.logo_format && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {logo.logo_format}
                      </span>
                    )}
                  </div>

                  {/* Color swatches */}
                  {(logo.background_color || logo.accent_color) && (
                    <div className="flex gap-2 mb-3">
                      {logo.background_color && (
                        <div className="group relative">
                          <div
                            className="w-6 h-6 rounded border border-gray-300 cursor-help"
                            style={{ backgroundColor: logo.background_color }}
                          />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {logo.background_color}
                          </span>
                        </div>
                      )}
                      {logo.accent_color && (
                        <div className="group relative">
                          <div
                            className="w-6 h-6 rounded border border-gray-300 cursor-help"
                            style={{ backgroundColor: logo.accent_color }}
                          />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {logo.accent_color}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        downloadLogo(
                          logo.logo_url,
                          logo.company_name,
                          logo.logo_type || 'png'
                        )
                      }
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                    <a
                      href={logo.logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => deleteLogo(logo.id)}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}