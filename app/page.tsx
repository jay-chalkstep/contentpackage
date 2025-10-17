import DashboardLayout from './dashboard-layout';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Logo Finder
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Search for company logos and build your personal logo library.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Search Logos
            </h3>
            <p className="text-gray-600">
              Find logos for any company using the Brandfetch API. Get multiple format options and color information.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your Library
            </h3>
            <p className="text-gray-600">
              Save and organize logos you find. Access them anytime from your personal library.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}