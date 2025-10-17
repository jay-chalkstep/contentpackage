import DashboardLayout from './dashboard-layout';
import Link from 'next/link';
import { Search, Library, Upload, CreditCard, Layers, Palette, Image } from 'lucide-react';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to the CDCO Content Creator
          </h2>
          <p className="text-xl text-gray-600">
            Design program assets with client art
          </p>
        </div>

        {/* Logo Management Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Logo Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/search" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <Search className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Logo Search
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Find company logos using the Brandfetch API with multiple format options.
                </p>
              </div>
            </Link>

            <Link href="/upload" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <Upload className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Logo Upload
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Upload logos directly from your computer when API search isn't available.
                </p>
              </div>
            </Link>

            <Link href="/library" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <Library className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Logo Library
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Access and manage your saved logos in one organized location.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Card Templates Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Card Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/card-upload" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <CreditCard className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Card Upload
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Upload custom card templates to use as backgrounds for your mockups.
                </p>
              </div>
            </Link>

            <Link href="/card-library" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <Layers className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Card Library
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Browse and manage your collection of card templates.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Design Tools Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Design Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/card-designer" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <Palette className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Card Designer
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Create professional card mockups with drag-and-drop logo positioning.
                </p>
              </div>
            </Link>

            <Link href="/mockup-library" className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#0453f8] transition-all cursor-pointer">
                <div className="flex items-center mb-3">
                  <Image className="h-6 w-6 text-[#0453f8] mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0453f8] transition-colors">
                    Mockup Library
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  View, download, and manage your created card mockup designs.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}