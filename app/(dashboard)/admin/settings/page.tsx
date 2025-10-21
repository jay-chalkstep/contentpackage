import { OrganizationProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function OrganizationSettingsPage() {
  const { orgRole } = auth();

  // Redirect non-admins
  if (orgRole !== 'org:admin') {
    redirect('/');
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your organization profile, settings, and preferences.
        </p>
      </div>

      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'shadow-lg',
          },
        }}
        routing="hash"
      />
    </div>
  );
}
