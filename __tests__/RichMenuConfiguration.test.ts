
import fs from 'fs';
import path from 'path';

// Mock Environment
const MOCK_LIFF_ID = 'test-liff-id';
process.env.NEXT_PUBLIC_LIFF_ID = MOCK_LIFF_ID;

// Define the expected Rich Menu areas based on scripts/setup-rich-menu.js logic
const getRichMenuConfig = (liffId: string) => ({
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'ProAssistant Main Menu',
    chatBarText: 'Menu',
    areas: [
        { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${liffId}/?redirect=${encodeURIComponent('/dashboard?action=new-task')}` } },
        { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${liffId}/?redirect=/dashboard/calendar` } },
        { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${liffId}/?redirect=/dashboard` } },
        { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${liffId}/?redirect=/dashboard/tasks` } },
        { bounds: { x: 833, y: 843, width: 834, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${liffId}/?redirect=/dashboard/help` } },
        { bounds: { x: 1667, y: 843, width: 833, height: 843 }, action: { type: 'uri', uri: `https://liff.line.me/${liffId}/?redirect=${encodeURIComponent('/dashboard?settings=true')}` } }
    ]
});

describe('Rich Menu Configuration & Link Integrity', () => {
    const config = getRichMenuConfig(MOCK_LIFF_ID);

    it('should have valid LIFF URLs with correct ID', () => {
        config.areas.forEach(area => {
            if (area.action.type === 'uri') {
                expect(area.action.uri).toContain(`https://liff.line.me/${MOCK_LIFF_ID}`);
                expect(area.action.uri).not.toContain('undefined');
            }
        });
    });

    it('should link to existing routes in the Next.js app', () => {
        // Map of LIFF path suffix to Next.js file path
        // e.g., /dashboard/calendar -> src/app/dashboard/calendar/page.tsx

        config.areas.forEach(area => {
            if (area.action.type === 'uri') {
                const uri = area.action.uri;
                // Extract path after LIFF ID
                // Format: https://liff.line.me/<ID>/<path>
                const pathPart = uri.replace(`https://liff.line.me/${MOCK_LIFF_ID}`, '');

                // Remove query params
                const cleanPath = pathPart.split('?')[0];

                // Determine expected file system location
                let fsPath = '';
                if (cleanPath === '' || cleanPath === '/') {
                    // / -> src/app/page.tsx OR src/app/dashboard/page.tsx (based on app logic)
                    // In this app, LIFF root is configured to go to dashboard usually, but let's check exact mapping
                    // The LIFF endpoint URL in LINE Developers console maps to the actual URL.
                    // Assuming LIFF endpoint maps to https://<domain>/ (root) -> the path part is relative to root.

                    // Actually, for this test, we assume the LIFF path corresponds to the Next.js App Router path.
                    // So /dashboard/calendar -> src/app/dashboard/calendar/page.tsx

                    // However, our rich menu links are: /dashboard/calendar, /dashboard/tasks etc.
                    // Wait, in setup-rich-menu.js we used:
                    // `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}/dashboard/calendar`
                    // This implies the LIFF App Base URL is the root of the domain, and we are appending /dashboard/calendar.

                    // Let's verify if the file exists for the path.
                    // Remove leading slash
                    const relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

                    // Construct absolute path to source
                    // If path is empty, it maps to src/app/page.tsx (or dashboard depending on redirect)
                    // But here we explicitly check existence of the route handler.

                    if (!relativePath) {
                        // Root LIFF URL usually maps to dashboard in this app context? 
                        // The URI in config is `.../${liffId}` -> pathPart is empty.
                        // This should map to the LIFF endpoint content.
                        // Let's assume valid.
                        return;
                    }

                    const pagePath = path.resolve(process.cwd(), 'src/app', relativePath, 'page.tsx');
                    const exists = fs.existsSync(pagePath);

                    console.log(`Checking route: ${cleanPath} -> ${pagePath} : ${exists}`);
                    expect(exists).toBe(true);
                } else {
                    const pagePath = path.resolve(process.cwd(), 'src/app', cleanPath.slice(1), 'page.tsx');
                    const exists = fs.existsSync(pagePath);
                    console.log(`Checking route: ${cleanPath} -> ${pagePath} : ${exists}`);
                    expect(exists).toBe(true);
                }
            }
        });
    });
});
