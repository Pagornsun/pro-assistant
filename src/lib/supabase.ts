import { createClient } from '@supabase/supabase-js'

// Fallback to empty string to prevent build errors, but runtime will fail if missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Public client for client-side interactions
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations that bypass RLS (use with caution)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
