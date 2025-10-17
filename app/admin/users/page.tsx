import { getCurrentUser } from '@/lib/auth/server'
import { createServerSupabaseClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import DashboardLayoutAuth from '@/app/dashboard-layout-auth'
import { Users, Mail, Shield, UserPlus, Trash2, MoreVertical } from 'lucide-react'

async function getOrganizationUsers(organizationId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

export default async function UserManagementPage() {
  const currentUser = await getCurrentUser()

  // Redirect if not authenticated or not admin
  if (!currentUser || currentUser.profile.role !== 'admin') {
    redirect('/')
  }

  const users = await getOrganizationUsers(currentUser.profile.organization_id)
  const userCount = users.length
  const maxUsers = currentUser.organization?.max_users || 5

  return (
    <DashboardLayoutAuth>
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">
            Manage your team members and their access to {currentUser.organization?.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {userCount}
                  <span className="text-sm font-normal text-gray-500">/ {maxUsers === -1 ? '∞' : maxUsers}</span>
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite User Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={maxUsers !== -1 && userCount >= maxUsers}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Storage Used
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar_url}
                            alt={user.full_name || user.email}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                          {user.id === currentUser.profile.id && (
                            <span className="ml-2 text-xs text-gray-500">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`h-2 w-2 rounded-full mr-1 ${
                        user.is_active ? 'bg-green-600' : 'bg-red-600'
                      }`}></div>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.storage_used_mb} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.id !== currentUser.profile.id && (
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upgrade prompt if at limit */}
        {maxUsers !== -1 && userCount >= maxUsers && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  You've reached your user limit
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your current plan allows for {maxUsers} users. Upgrade to add more team members.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutAuth>
  )
}