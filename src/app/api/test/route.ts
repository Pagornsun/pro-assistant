import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        console.log('Testing Supabase Connection...');

        // Try to connect to Supabase (Health Check)
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                hint: 'Check Supabase keys'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Supabase Connection OK! 🚀',
            table_check: 'profiles',
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
