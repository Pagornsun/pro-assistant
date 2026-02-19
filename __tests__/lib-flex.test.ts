import { getTaskFlexMessage } from '@/lib/flex';
import { getWelcomeFlexMessage } from '@/lib/flex-welcome';

describe('Flex Message Generator', () => {

    test('getTaskFlexMessage returns valid structure', () => {
        const flex = getTaskFlexMessage('Test Task', 'Test Description');
        expect(flex.type).toBe('flex');
        expect(flex.contents.type).toBe('bubble');
    });

    test('getWelcomeFlexMessage returns valid structure', () => {
        const flex = getWelcomeFlexMessage();
        expect(flex.type).toBe('flex');
        expect(flex.altText).toContain('Welcome');

        const bubble = flex.contents as Record<string, unknown>;
        expect(bubble.type).toBe('bubble');

        const body = bubble.body as Record<string, unknown>;
        const bodyContents = body.contents as Record<string, unknown>[];
        expect(bodyContents[0].text).toBe('Welcome to Kinn');

        const footer = bubble.footer as Record<string, unknown>;
        const footerContents = footer.contents as Record<string, unknown>[];
        const footerAction = footerContents[0].action as Record<string, unknown>;
        expect(footerAction.label).toBe('Get Started');
    });

    test('getTaskFlexMessage handles null description', () => {
        const flex = getTaskFlexMessage('Title Only', null);
        const bubble = flex.contents as Record<string, unknown>;
        const body = bubble.body as Record<string, unknown>;
        const contents = body.contents as Record<string, unknown>[];
        expect(contents[0].text).toBe('No description provided.');
    });

    test('Flex footer contains correct dashboard URI', () => {
        const flex = getTaskFlexMessage('Task', 'Desc');
        const bubble = flex.contents as Record<string, unknown>;
        const footer = bubble.footer as Record<string, unknown>;
        const contents = footer.contents as Record<string, unknown>[];
        const action = contents[0].action as Record<string, unknown>;
        expect(action.uri).toBe('https://liff.line.me/2009152458-0jLBmnkp');
    });

});
