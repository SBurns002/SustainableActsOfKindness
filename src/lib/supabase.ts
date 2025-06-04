import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxcuiyvxxvylackjjlgn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y3VpeXZ4eHZ5bGFja2pqbGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM2NDMsImV4cCI6MjA2NDU2OTY0M30.gwzVhnfihnEu3mGdVQPz-NjKv1UsHSqwFQQEeyA6ALM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);