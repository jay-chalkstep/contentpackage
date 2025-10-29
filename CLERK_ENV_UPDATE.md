# Clerk Environment Variables Update

## Issue
Clerk has deprecated the `afterSignInUrl` and `afterSignUpUrl` props. These need to be replaced with the new `fallbackRedirectUrl` or `forceRedirectUrl` props.

## Required Changes

### In Vercel (Production)
Update the following environment variables in your Vercel project settings:

**Remove these (deprecated):**
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

**Add these (new):**
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`

### Steps to Update in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Delete the old variables (AFTER_SIGN_IN_URL and AFTER_SIGN_UP_URL)
4. Add the new variables (SIGN_IN_FALLBACK_REDIRECT_URL and SIGN_UP_FALLBACK_REDIRECT_URL)
5. Redeploy your application

## Local Environment
The `.env.local` file has already been updated with the new variable names.

## References
- [Clerk Custom Redirects Documentation](https://clerk.com/docs/guides/custom-redirects#redirect-url-props)
