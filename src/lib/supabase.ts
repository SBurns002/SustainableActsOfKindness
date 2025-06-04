import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxcuiyvxxvylackjjlgn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y3VpeXZ4eHZ5bGFja2pqbGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2ODI0MDAsImV4cCI6MjAyNTI1ODQwMH0.Wd0VZPPOEt_Kf_QZCqPHXKGZHoNi7KBg5UHyAqXtpHw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);