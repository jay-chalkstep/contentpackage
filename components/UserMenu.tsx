'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import {
  User,
  LogOut,
  Settings,
  Users,
  Building2,
  CreditCard,
  ChevronDown,
  Shield,
  Activity
} from 'lucide-react'

interface UserMenuProps {
  user: any
  profile: any
  organization: any
}

export default function UserMenu({ user, profile, organization }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || user.email}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center text-white text-sm font-semibold">
              {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {profile?.full_name || user.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500">
              {organization?.name || 'Personal Account'}
            </p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <Shield className="h-3 w-3 mr-1" />
                {isAdmin ? 'Admin' : 'Member'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {organization?.subscription_tier || 'Free'}
              </span>
            </div>
          </div>

          {/* Organization Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{organization?.name}</span>
              </div>
              {isAdmin && (
                <span className="text-xs text-gray-500">
                  {organization?.slug}
                </span>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </button>
                <button
                  onClick={() => router.push('/admin/analytics')}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Analytics</span>
                </button>
                <button
                  onClick={() => router.push('/admin/billing')}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Billing & Subscription</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
              </>
            )}

            <button
              onClick={() => router.push('/settings/profile')}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Profile Settings</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => router.push('/settings/organization')}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Organization Settings</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 py-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}