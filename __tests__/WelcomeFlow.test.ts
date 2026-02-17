
import { handleLineEvent } from '../src/lib/line';
import { supabaseAdmin } from '../src/lib/supabase';

// Mock dependencies
jest.mock('@line/bot-sdk', () => ({
    Client: jest.fn().mockImplementation(() => ({
        replyMessage: jest.fn().mockResolvedValue({}),
        pushMessage: jest.fn().mockResolvedValue({}),
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

// Access the mocked client instance
const { Client } = require('@line/bot-sdk');
const mockReplyMessage = jest.fn();
Client.mockImplementation(() => ({
    replyMessage: mockReplyMessage,
    pushMessage: jest.fn(),
}));

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
            single: jest.fn().mockResolvedValue({ data: { id: 'user-uuid-123', line_user_id: mockUserId }, error: null })
        };

        // Mock Chat History (Select & Insert)
        const mockChatHistoryQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }), // Return empty history
            insert: jest.fn().mockResolvedValue({ error: null })
        };

        (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
            if (table === 'profiles') return mockProfileQuery;
            if (table === 'chat_history') return mockChatHistoryQuery;
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                insert: jest.fn().mockResolvedValue({ error: null })
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

        expect(mockReplyMessage).toHaveBeenCalledTimes(1);
        const args = mockReplyMessage.mock.calls[0];
        expect(args[0]).toBe(mockReplyToken);
        expect(args[1].altText).toContain('Welcome to Kinn');
    });

    it('should send Welcome Flex Message on "Help" keyword', async () => {
        const event: any = {
            type: 'message',
            message: { type: 'text', text: 'Help', id: 'msg123' },
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

    it('should send Welcome Flex Message on "สวัสดี" keyword', async () => {
        const event: any = {
            type: 'message',
            message: { type: 'text', text: 'สวัสดีครับ', id: 'msg123' },
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
