import { EventEmitter } from 'events';
import { supabaseAdmin } from '../src/lib/supabase';
import { analyzeTask, analyzeImage } from '../src/lib/gemini';

// Mock fetch globally for showLoadingAnimation
global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

// 1. Setup global mocks for dependencies that line.ts uses
jest.mock('../src/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
    }
}));

jest.mock('../src/lib/gemini', () => ({
    analyzeTask: jest.fn(),
    analyzeImage: jest.fn(),
}));

jest.mock('../src/lib/flex', () => ({
    getTaskFlexMessage: jest.fn().mockReturnValue({ type: 'flex', altText: 'Task Created' }),
}));
jest.mock('../src/lib/flex-welcome', () => ({
    getWelcomeFlexMessage: jest.fn().mockReturnValue({ type: 'flex', altText: 'Welcome to Kinn' }),
}));

// 2. Mock LINE SDK (Wait to require line.ts until after this)
const mockReplyMessage = jest.fn().mockResolvedValue({});
jest.mock('@line/bot-sdk', () => {
    return {
        Client: jest.fn().mockImplementation(() => ({
            replyMessage: mockReplyMessage,
            pushMessage: jest.fn().mockResolvedValue({}),
            showLoadingAnimation: jest.fn().mockResolvedValue({}),
            getMessageContent: jest.fn().mockImplementation(() => {
                const stream = new EventEmitter();
                setTimeout(() => {
                    stream.emit('data', Buffer.from('fake-image'));
                    stream.emit('end');
                }, 10);
                return stream;
            }),
        })),
    };
});

// 3. Now require line.ts after the mock is established
const { handleLineEvent, cleanToken, getOrCreateProfile } = require('../src/lib/line');

describe('LINE Integration Logic', () => {

    describe('cleanToken', () => {
        it('should remove prefixes and newlines', () => {
            const token = 'Bearer  MY-TOKEN\n';
            expect(cleanToken(token)).toBe('MY-TOKEN');
        });
    });

    describe('getOrCreateProfile', () => {
        const mockLineUserId = 'U12345';

        it('should return existing profile if found', async () => {
            const mockProfile = { id: 'uuid-123', line_user_id: mockLineUserId };

            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
            });

            const result = await getOrCreateProfile(mockLineUserId);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('handleLineEvent', () => {
        const mockUserId = 'U12345';
        const mockReplyToken = 'reply-token-123';
        const mockProfile = { id: 'uuid-123', line_user_id: mockUserId };

        beforeEach(() => {
            jest.clearAllMocks();

            // Setup basic Supabase mock chain
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
                insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            };
            (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
        });

        it('should handle "follow" event', async () => {
            const event: any = { type: 'follow', source: { userId: mockUserId }, replyToken: mockReplyToken };
            await handleLineEvent(event);

            expect(mockReplyMessage).toHaveBeenCalledWith(
                mockReplyToken,
                expect.objectContaining({ altText: 'Welcome to Kinn' })
            );
        });

        it('should handle task creation from text', async () => {
            (analyzeTask as jest.Mock).mockResolvedValue({
                isTask: true,
                title: 'Test Task',
                description: 'Test Desc'
            });

            const event: any = {
                type: 'message',
                message: { type: 'text', text: 'Create task', id: 'm1' },
                source: { userId: mockUserId },
                replyToken: mockReplyToken
            };

            await handleLineEvent(event);

            expect(supabaseAdmin.from).toHaveBeenCalledWith('tasks');
            expect(analyzeTask).toHaveBeenCalled();
        });

        it('should handle image slip analysis', async () => {
            (analyzeImage as jest.Mock).mockResolvedValue({
                is_slip: true,
                amount: 100,
                receiver: 'Shop'
            });

            const event: any = {
                type: 'message',
                message: { type: 'image', id: 'img1' },
                source: { userId: mockUserId },
                replyToken: mockReplyToken
            };

            await handleLineEvent(event);

            expect(analyzeImage).toHaveBeenCalled();
            expect(supabaseAdmin.from).toHaveBeenCalledWith('tasks');
            expect(mockReplyMessage).toHaveBeenCalledWith(
                mockReplyToken,
                expect.objectContaining({ text: expect.stringContaining('บันทึกรายจ่ายเรียบร้อย') })
            );
        });
    });
});
