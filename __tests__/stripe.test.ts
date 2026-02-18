import { stripe } from '@/lib/stripe';

// Mock stripe
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => {
        return {
            checkout: {
                sessions: {
                    create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
                },
            },
        };
    });
});

describe('Stripe Utility', () => {

    test('stripe client is initialized', () => {
        expect(stripe).toBeDefined();
    });

    test('createCheckoutSession mock returns valid URL', async () => {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: 'price_123', quantity: 1 }],
            mode: 'subscription',
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
        });

        expect(session.url).toBe('https://checkout.stripe.com/test');
    });

});
