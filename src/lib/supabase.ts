import { createClient } from '@supabase/supabase-js'

const isValidUrl = (urlString: string) => {
    try {
        return Boolean(new URL(urlString));
    } catch (e) {
        return false;
    }
}

// Fallback to placeholder if env var is missing OR invalid
const getSupabaseUrl = () => {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || !isValidUrl(url)) {
        console.warn('⚠️ Supabase URL is missing or invalid. Using placeholder.');
        return 'https://placeholder.supabase.co';
    }
    return url;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Public client for client-side interactions
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations that bypass RLS (use with caution)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
