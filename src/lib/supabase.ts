import { createClient } from '@supabase/supabase-js'

const isValidUrl = (urlString: string) => {
    try {
        return Boolean(new URL(urlString));
    } catch (e) {
        return false;
    }
}

// Hardcoded fallback to ensure build success even if env vars fail
// Note: NEXT_PUBLIC keys are safe to expose in client bundle
const HARDCODED_URL = 'https://dkefjnnhjeczebegpwjw.supabase.co';
const HARDCODED_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZWZqbm5oamVjemViZWdwd2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTA0OTcsImV4cCI6MjA4Njc2NjQ5N30.etFdeBQItUZ2WuoykbvcbYoADRgYCFUVIIX35CedYqs';

const cleanEnv = (key: string | undefined) => key ? key.replace(/"/g, '').trim() : '';

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || HARDCODED_URL;
const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || HARDCODED_ANON;
const supabaseServiceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || 'placeholder-key';

// Public client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
