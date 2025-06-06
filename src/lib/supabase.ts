import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to hardcoded values if env vars are not available
const fallbackUrl = 'https://kxcuiyvxxvylackjjlgn.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y3VpeXZ4eHZ5bGFja2pqbGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM2NDMsImV4cCI6MjA2NDU2OTY0M30.gwzVhnfihnEu3mGdVQPz-NjKv1UsHSqwFQQEeyA6ALM';

const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

// Basic validation
if (!finalUrl || !finalKey) {
  console.error('Supabase configuration missing');
  throw new Error('Supabase configuration is required');
}

// Log configuration status (without exposing sensitive data)
console.log('Supabase configuration:', {
  url: finalUrl,
  keyLength: finalKey?.length || 0,
  usingFallback: !supabaseUrl || !supabaseAnonKey
});

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});