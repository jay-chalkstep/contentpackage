/**
 * Auth Context Helper for Clerk + Supabase Integration
 *
 * This module provides utilities to get the current authenticated user's
 * context (userId and organizationId) from Clerk for use in Supabase queries.
 */

import { auth } from '@clerk/nextjs/server';

export interface UserContext {
  userId: string;
  orgId: string;
}

/**
 * Get the current authenticated user and organization context
 *
 * Use this in server components and API routes to get the current user's
 * Clerk userId and organization ID for filtering Supabase queries.
 *
 * @throws Error if user is not authenticated or not in an organization
 * @returns UserContext with userId and orgId
 *
 * @example
 * // In a server component or API route
 * import { getUserContext } from '@/lib/auth-context';
 *
 * export async function GET() {
 *   const { userId, orgId } = await getUserContext();
 *
 *   const { data } = await supabase
 *     .from('folders')
 *     .select('*')
 *     .eq('organization_id', orgId)
 *     .eq('created_by', userId);
 *
 *   return Response.json(data);
 * }
 */
export async function getUserContext(): Promise<UserContext> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: No user ID found');
  }

  if (!orgId) {
    throw new Error('Unauthorized: No organization ID found');
  }

  return { userId, orgId };
}

/**
 * Check if the current user has admin role in their organization
 *
 * @returns Promise<boolean> - true if user is an admin
 *
 * @example
 * import { isAdmin } from '@/lib/auth-context';
 *
 * export async function DELETE(request: Request) {
 *   if (!await isAdmin()) {
 *     return Response.json({ error: 'Forbidden' }, { status: 403 });
 *   }
 *   // ... admin-only logic
 * }
 */
export async function isAdmin(): Promise<boolean> {
  const { orgRole } = await auth();
  return orgRole === 'org:admin';
}

/**
 * Get user context or return null if not authenticated
 *
 * Use this when authentication is optional and you want to handle
 * unauthenticated users gracefully.
 *
 * @returns UserContext | null
 */
export async function getUserContextOptional(): Promise<UserContext | null> {
  try {
    return await getUserContext();
  } catch {
    return null;
  }
}
