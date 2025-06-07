# Supabase Configuration Guide for Password Reset Fix

## CRITICAL: Update These Settings in Your Supabase Dashboard

### 1. Authentication Settings
Go to **Authentication → Settings** in your Supabase dashboard:

**Site URL:**
```
https://gentle-madeleine-5ec626.netlify.app
```

**Redirect URLs (Add all of these):**
```
https://gentle-madeleine-5ec626.netlify.app/auth
https://gentle-madeleine-5ec626.netlify.app/reset-password
https://gentle-madeleine-5ec626.netlify.app/auth?type=signup
https://gentle-madeleine-5ec626.netlify.app/**
```

### 2. Email Templates Configuration

#### Reset Password Template
Go to **Authentication → Email Templates → Reset Password**

Update the **Confirm your recovery** button URL to:
```
{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

#### Confirm Signup Template  
Go to **Authentication → Email Templates → Confirm Signup**

Update the **Confirm your mail** button URL to:
```
{{ .SiteURL }}/auth?token_hash={{ .TokenHash }}&type=signup
```

### 3. Additional Settings

#### Email Auth Settings
- ✅ Enable email confirmations: **ON**
- ✅ Enable email change confirmations: **ON** 
- ✅ Secure email change: **ON**

#### Password Settings
- Minimum password length: **6**
- Password strength: **Fair** or higher

### 4. Test the Configuration

After saving these settings:

1. Wait 2-3 minutes for changes to propagate
2. Test password reset:
   - Go to `/auth`
   - Click "Forgot your password?"
   - Enter your email
   - Check email for reset link
   - Click the link - should now work!

3. Test email confirmation:
   - Create new account
   - Check email for confirmation link
   - Click link - should redirect properly

### 5. Troubleshooting

If still having issues, check:
- Browser console for error messages
- Network tab to see the actual redirect URLs
- Ensure all URLs are exactly as specified above
- Try incognito/private browsing mode

The application code has been updated to handle both old and new Supabase token formats, so once the dashboard settings are correct, everything should work seamlessly.

## Current Application Status
✅ ResetPassword component handles all token formats
✅ Email confirmation flow improved  
✅ Better error handling and user feedback
✅ Production URL handling implemented
✅ Automatic session cleanup for security
⏳ **Supabase dashboard settings need manual update**

After updating the Supabase settings as described above, your password reset and email confirmation flows will work correctly!