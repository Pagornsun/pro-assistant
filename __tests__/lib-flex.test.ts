import { getTaskFlexMessage } from '@/lib/flex';
import { getWelcomeFlexMessage } from '@/lib/flex-welcome';

describe('Flex Message Generator', () => {

    test('getTaskFlexMessage returns valid structure', () => {
        // ... (existing test)
    });

    test('getWelcomeFlexMessage returns valid structure', () => {
        const flex = getWelcomeFlexMessage();
        expect(flex.type).toBe('flex');
        expect(flex.altText).toContain('Welcome');

        const bubble = flex.contents as any;
        expect(bubble.type).toBe('bubble');
        expect(bubble.body.contents[0].text).toBe('Welcome to Kinn');
        expect(bubble.footer.contents[0].action.label).toBe('Get Started');
    });

    // ...

    test('getTaskFlexMessage handles null description', () => {
        const flex = getTaskFlexMessage('Title Only', null);
        const bubble = flex.contents as any;
        expect(bubble.body.contents[0].text).toBe('No description provided.');
    });

    test('Flex footer contains correct dashboard URI', () => {
        const flex = getTaskFlexMessage('Task', 'Desc');
        const bubble = flex.contents as any;
        expect(bubble.footer.contents[0].action.uri).toBe('https://liff.line.me/2009152458-0jLBmnkp');
    });

});
