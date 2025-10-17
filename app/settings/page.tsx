'use client';

import { useState } from 'react';
import DashboardLayout from '../dashboard-layout';
import { Save, Database, Key, Info, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [brandfetchKey, setBrandfetchKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const handleSave = () => {
    // In a real app, you'd save these to a secure backend
    // For now, we'll just show a success message
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Settings</h2>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* API Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brandfetch API Key
                </label>
                <input
                  type="password"
                  value={brandfetchKey}
                  onChange={(e) => setBrandfetchKey(e.target.value)}
                  placeholder="Enter your Brandfetch API key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://brandfetch.com/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    brandfetch.com/developers
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Database Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="Enter your Supabase anon key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <p className="text-sm text-gray-500">
                Find your project settings in the{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Supabase Dashboard
                </a>
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Setup Instructions
            </h3>
            <ol className="space-y-2 text-blue-800 list-decimal list-inside">
              <li>
                Create a Brandfetch account and get your API key from their developer portal
              </li>
              <li>
                Create a Supabase project and run the provided SQL schema in the SQL editor
              </li>
              <li>
                Copy your Supabase project URL and anon key from the project settings
              </li>
              <li>
                Update the .env.local file with your credentials
              </li>
              <li>
                Restart the development server for changes to take effect
              </li>
            </ol>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}