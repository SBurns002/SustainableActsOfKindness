# Fix Supabase Password Reset Redirect

## Problem
Password reset emails are redirecting to `/reset-password` but the page shows "Invalid Reset Link".

## Solution
Update your Supabase project settings in the dashboard:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `kxcuiyvxxvylackjjlgn`

### 2. Update Authentication Settings
Navigate to **Authentication → Settings** and update:

**Site URL:**
```
https://gentle-madeleine-5ec626.netlify.app
```

**Redirect URLs (add these):**
```
https://gentle-madeleine-5ec626.netlify.app/auth
https://gentle-madeleine-5ec626.netlify.app/reset-password
https://gentle-madeleine-5ec626.netlify.app/auth?type=signup
```

### 3. Update Email Templates
Go to **Authentication → Email Templates**:

**For "Reset Password" template:**
Update the action URL to:
```
{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

**For "Confirm Signup" template:**
Update the action URL to:
```
{{ .SiteURL }}/auth?token_hash={{ .TokenHash }}&type=signup
```

### 4. Alternative Email Template URLs
If the above doesn't work, try these formats:

**Reset Password (Alternative 1):**
```
{{ .SiteURL }}/reset-password#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery
```

**Reset Password (Alternative 2):**
```
{{ .SiteURL }}/reset-password?access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery
```

### 5. Test the Fix
1. Save all settings in Supabase dashboard
2. Wait 2-3 minutes for changes to propagate
3. Try the password reset flow again:
   - Go to sign in page
   - Click "Forgot your password?"
   - Enter your email
   - Check your email for the reset link
   - Click the reset link
4. You should now be redirected to the working reset password page

### 6. Verify the Application
The ResetPassword component now handles:
- ✅ Both URL parameter formats (search params and hash)
- ✅ Token hash verification (newer Supabase method)
- ✅ Direct token method (older Supabase method)
- ✅ Better error handling and user feedback
- ✅ Automatic URL cleanup for security
- ✅ Proper redirect after successful reset

## Current Status
- ✅ ResetPassword component updated with robust token handling
- ✅ Route exists in App.tsx
- ✅ Production URL handling implemented
- ✅ Support for both token formats
- ⏳ Supabase settings need to be updated (manual step)

## Debugging
If it still doesn't work, check the browser console for:
- Token validation logs
- Any error messages
- The full URL structure when clicking the reset link

The component now logs detailed information to help debug token issues.

After updating the Supabase settings, your password reset flow should work correctly!