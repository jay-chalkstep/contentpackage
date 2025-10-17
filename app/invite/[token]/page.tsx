'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/config'
import { Building2, Mail, Shield, User, Eye, EyeOff, Loader2 } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: string
  organization_id: string
  expires_at: string
  organization?: {
    name: string
    slug: string
  }
  invited_by_user?: {
    full_name: string
    email: string
  }
}

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    validateInvitation()
  }, [params.token])

  const validateInvitation = async () => {
    try {
      // Get invitation details
      const { data: invite, error: inviteError } = await supabase
        .from('organization_invitations')
        .select(`
          *,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('token', params.token)
        .single()

      if (inviteError || !invite) {
        setError('Invalid or expired invitation link')
        setLoading(false)
        return
      }

      // Check if invitation is expired
      if (new Date(invite.expires_at) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      // Check if already accepted
      if (invite.accepted_at) {
        setError('This invitation has already been used')
        setLoading(false)
        return
      }

      // Get inviter details
      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', invite.invited_by)
        .single()

      setInvitation({
        ...invite,
        organization: invite.organizations,
        invited_by_user: inviter
      })
    } catch (err) {
      console.error('Error validating invitation:', err)
      setError('Failed to validate invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      // Check if user already has an account
      const { data: existingAuth } = await supabase.auth.signInWithPassword({
        email: invitation!.email,
        password: password
      })

      let userId: string

      if (existingAuth?.user) {
        // User exists, just add them to the organization
        userId = existingAuth.user.id
      } else {
        // Create new user account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: invitation!.email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        })

        if (signUpError) throw signUpError
        if (!authData.user) throw new Error('Failed to create account')

        userId = authData.user.id
      }

      // Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          organization_id: invitation!.organization_id,
          email: invitation!.email,
          full_name: fullName || invitation!.email.split('@')[0],
          role: invitation!.role,
          joined_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', params.token)

      if (updateError) throw updateError

      // Sign in and redirect
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation!.email,
        password
      })

      if (signInError) throw signInError

      router.push('/')
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(err.message || 'Failed to accept invitation')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f3f4f6] to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#374151]" />
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f3f4f6] to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/login"
            className="text-[#374151] hover:text-[#374151] font-medium"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f3f4f6] to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#e5e7eb] mb-4">
              <Mail className="h-6 w-6 text-[#374151]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">You're invited!</h1>
            <p className="mt-2 text-gray-600">
              Join <span className="font-semibold">{invitation?.organization?.name}</span>
            </p>
          </div>

          {/* Invitation Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Invited by:</span>
                <span className="font-medium text-gray-900">
                  {invitation?.invited_by_user?.full_name || invitation?.invited_by_user?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your email:</span>
                <span className="font-medium text-gray-900">{invitation?.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your role:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  invitation?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {invitation?.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                  {invitation?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Acceptance Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Your name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-[#374151]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Create password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-[#374151]"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-[#374151]"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={accepting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#374151] hover:bg-[#1f2937] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Accept Invitation & Join'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            By accepting this invitation, you agree to join {invitation?.organization?.name} on CDCO Content Creator
          </p>
        </div>
      </div>
    </div>
  )
}

// Add missing import
import Link from 'next/link'
import { X } from 'lucide-react'