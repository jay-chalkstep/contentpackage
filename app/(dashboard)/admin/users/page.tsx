import { OrganizationProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function UserManagementPage() {
  const { orgRole } = await auth();

  // Redirect non-admins
  if (orgRole !== 'org:admin') {
    redirect('/');
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your organization members, roles, and invitations.
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
