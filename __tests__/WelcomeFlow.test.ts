
import { supabaseAdmin } from '../src/lib/supabase';

// jest.mock is hoisted, so we cannot reference outer variables inside mock factories.
// Instead, use jest.fn() directly inside the factory.
const mockReplyMessage = jest.fn().mockResolvedValue({});
const mockPushMessage = jest.fn().mockResolvedValue({});

jest.mock('@line/bot-sdk', () => ({
    Client: jest.fn().mockImplementation(() => ({
        replyMessage: mockReplyMessage,
        pushMessage: mockPushMessage,
        getMessageContent: jest.fn(),
    })),
}));

jest.mock('../src/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
        auth: {
            admin: {
                listUsers: jest.fn(),
                createUser: jest.fn(),
            }
        }
    }
}));

// Import after mocks
import { handleLineEvent, lineClient } from '../src/lib/line';
const { Client } = require('@line/bot-sdk');

describe('Welcome Flow Logic', () => {
    const mockUserId = 'U1234567890abcdef';
    const mockReplyToken = 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA';

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock global fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({})
            } as Response)
        );

        // Mock Supabase Profile Lookup (Success case)
        const mockProfileQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'user-uuid-123', line_user_id: mockUserId }, error: null }),
            update: jest.fn().mockReturnThis()
        };

        // Mock Chat History (Select & Insert)
        const mockChatHistoryQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            insert: jest.fn().mockResolvedValue({ error: null })
        };

        (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
            if (table === 'profiles') return mockProfileQuery;
            if (table === 'chat_history') return mockChatHistoryQuery;
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                insert: jest.fn().mockResolvedValue({ error: null }),
                update: jest.fn().mockReturnThis()
            };
        });
    });

    it('should send Welcome Flex Message on "follow" event', async () => {
        const event: any = {
            type: 'follow',
            replyToken: mockReplyToken,
            source: { userId: mockUserId, type: 'user' },
            timestamp: 1234567890,
            mode: 'active'
        };

        await handleLineEvent(event);

        // lineClient is the instance created by new Client() — check its replyMessage
        expect(mockReplyMessage).toHaveBeenCalledTimes(1);
        const args = mockReplyMessage.mock.calls[0];
        expect(args[0]).toBe(mockReplyToken);
        expect(args[1].altText).toContain('ProAssistant Tutorial (1/4)');
    });

    it('should send Welcome Flex Message on "help" keyword', async () => {
        const event: any = {
            type: 'message',
            message: { type: 'text', text: 'help', id: 'msg123' },
            replyToken: mockReplyToken,
            source: { userId: mockUserId, type: 'user' },
            timestamp: 1234567890,
            mode: 'active'
        };

        await handleLineEvent(event);

        expect(mockReplyMessage).toHaveBeenCalledTimes(1);
        const args = mockReplyMessage.mock.calls[0];
        expect(args[0]).toBe(mockReplyToken);
        expect(args[1].altText).toContain('Welcome to Kinn');
    });

    it('should send Welcome Flex Message on "สวัสดี" keyword (exact match)', async () => {
        const event: any = {
            type: 'message',
            message: { type: 'text', text: 'สวัสดี', id: 'msg123' },
            replyToken: mockReplyToken,
            source: { userId: mockUserId, type: 'user' },
            timestamp: 1234567890,
            mode: 'active'
        };

        await handleLineEvent(event);

        expect(mockReplyMessage).toHaveBeenCalledTimes(1);
        const args = mockReplyMessage.mock.calls[0];
        expect(args[0]).toBe(mockReplyToken);
        expect(args[1].altText).toContain('Welcome to Kinn');
    });
});
