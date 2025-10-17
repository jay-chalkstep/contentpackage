# Google OAuth Setup Guide

## Quick Fix for Now
**For immediate testing, use email/password registration instead of Google Sign-in.**

Click "Sign up" at the bottom of the login page to create an account with email/password.

## Setting Up Google OAuth (When Ready)

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API:
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google+ API" and enable it

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Configure OAuth consent screen first if prompted:
     - Choose "External" user type
     - Fill in app name, support email
     - Add your domain to authorized domains
     - Add scopes: email, profile, openid

5. Create OAuth Client ID:
   - Application type: Web application
   - Name: CDCO Content Creator
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:3001
     https://your-domain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3001/auth/callback
     https://your-supabase-project.supabase.co/auth/v1/callback
     https://your-domain.com/auth/callback
     ```

6. Save the Client ID and Client Secret

### Step 2: Supabase Configuration

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Authentication → Providers
4. Find Google in the list and click to expand
5. Toggle "Enable Google" to ON
6. Add your credentials:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
7. The redirect URL shown here needs to be added to Google Console
8. Click "Save"

### Step 3: Update Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Step 4: Test

1. Restart your development server
2. Try "Sign in with Google" again

## Troubleshooting

### "Provider is not enabled" Error
- Ensure Google provider is enabled in Supabase Dashboard
- Check that you've saved the settings in Supabase

### "Redirect URI mismatch" Error
- Make sure the redirect URI in Google Console matches exactly:
  - `https://[your-project-ref].supabase.co/auth/v1/callback`
- Add all variations (http/https, with/without www)

### "Invalid client" Error
- Double-check Client ID and Secret are correct
- Ensure no extra spaces when copying credentials

## For Production

When deploying to production:
1. Add your production domain to Google OAuth authorized origins
2. Add production callback URL to authorized redirect URIs
3. Update Supabase with production URLs
4. Set environment variables in your hosting platform