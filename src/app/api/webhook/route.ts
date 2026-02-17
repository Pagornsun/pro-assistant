import { NextResponse } from 'next/server';
import { handleLineEvent } from '@/lib/line';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const events = body.events || [];

        for (const event of events) {
            await handleLineEvent(event);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
