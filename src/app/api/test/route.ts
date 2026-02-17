import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        console.log('Testing Supabase Connection...');

        // 1. Check Anon Client
        const { error: anonError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });

        // 2. Check Admin Client (Service Role)
        let adminStatus = 'Unknown';
        try {
            const { error: adminError } = await supabaseAdmin
                .from('profiles')
                .select('count', { count: 'exact', head: true });

            if (adminError) {
                adminStatus = `Failed: ${adminError.message}`;
            } else {
                adminStatus = 'OK (Service Role Working)';
            }
        } catch (e: any) {
            adminStatus = `Exception: ${e.message}`;
        }

        return NextResponse.json({
            success: true,
            anon_check: anonError ? `Failed: ${anonError.message}` : 'OK',
            admin_check: adminStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Test API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
