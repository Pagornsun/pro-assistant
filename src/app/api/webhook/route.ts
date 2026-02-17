import { NextResponse } from 'next/server';
import { handleLineEvent } from '@/lib/line';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const events = body.events || [];

        console.log(`[Webhook] Received ${events.length} events at ${new Date().toISOString()}`);

        for (const event of events) {
            console.log(`[Webhook] Processing event: ${event.replyToken?.substring(0, 5)}...`);
            await handleLineEvent(event);
            console.log(`[Webhook] Processed event: ${event.replyToken?.substring(0, 5)}...`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
