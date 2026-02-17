import { createClient } from '@supabase/supabase-js'

const isValidUrl = (urlString: string) => {
    try {
        return Boolean(new URL(urlString));
    } catch (e) {
        return false;
    }
}

// ULTRA-SAFE MODE: Hardcoded values only
const supabaseUrl = 'https://dkefjnnhjeczebegpwjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZWZqbm5oamVjemViZWdwd2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTA0OTcsImV4cCI6MjA4Njc2NjQ5N30.etFdeBQItUZ2WuoykbvcbYoADRgYCFUVIIX35CedYqs';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrZWZqbm5oamVjemViZWdwd2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5MDQ5NywiZXhwIjoyMDg2NzY2NDk3fQ.C-kXcxAT2LFgu5ZVgqFc-dMPdoZRveVpXCmwXTWzSxQ';

// Public client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
