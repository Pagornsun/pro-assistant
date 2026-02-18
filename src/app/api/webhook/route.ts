import { NextResponse } from 'next/server';
import { handleLineEvent } from '@/lib/line';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to check if event was already processed
async function isDuplicateEvent(eventId: string) {
    if (!eventId) return false;

    // Check if event exists
    const { data } = await supabaseAdmin
        .from('processed_events')
        .select('id')
        .eq('event_id', eventId)
        .single();

    if (data) return true;

    // Mark as processed immediately
    await supabaseAdmin
        .from('processed_events')
        .insert({ event_id: eventId });

    return false;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const events = body.events || [];

        console.log(`[Webhook] Received ${events.length} events at ${new Date().toISOString()}`);

        for (const event of events) {
            const eventId = event.webhookEventId;

            // Deduplication Check
            try {
                if (eventId && await isDuplicateEvent(eventId)) {
                    console.warn(`[Webhook] Duplicate event detected: ${eventId}, skipping.`);
                    continue;
                }
            } catch (dedupError) {
                // If table doesn't exist yet, just proceed but log warning
                console.error('[Webhook] Dedup check failed (table might be missing):', dedupError);
            }

            console.log(`[Webhook] Processing event: ${event.replyToken?.substring(0, 5)}...`);
            await handleLineEvent(event);
            console.log(`[Webhook] Processed event: ${event.replyToken?.substring(0, 5)}...`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
