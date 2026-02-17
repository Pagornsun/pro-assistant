import { analyzeTask } from '@/lib/gemini';

// Mock the Google Generative AI library
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => {
            return {
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn().mockImplementation((params) => {
                        // Mock response based on input prompt (simplified)
                        const prompt = params.contents[0].parts[0].text;

                        let responseText = '';
                        if (prompt.includes('นัดประชุม')) {
                            responseText = JSON.stringify({
                                isTask: true,
                                title: 'นัดประชุม',
                                description: 'พรุ่งนี้ 10 โมง',
                                replyText: 'รับทราบครับ นัดประชุมพรุ่งนี้ 10 โมง'
                            });
                        } else if (prompt.includes('สวัสดี')) {
                            responseText = JSON.stringify({
                                isTask: false,
                                title: null,
                                description: null,
                                replyText: 'สวัสดีครับ มีอะไรให้ช่วยไหมครับ'
                            });
                        } else {
                            responseText = JSON.stringify({
                                isTask: false,
                                title: null,
                                description: null,
                                replyText: 'ไม่เข้าใจครับ'
                            });
                        }

                        return {
                            response: Promise.resolve({
                                text: () => responseText
                            })
                        };
                    })
                })
            };
        })
    };
});

describe('Gemini AI Logic', () => {
    it('should correctly identify a task', async () => {
        const result = await analyzeTask('ช่วยนัดประชุมพรุ่งนี้ 10 โมงหน่อย');
        expect(result.isTask).toBe(true);
        expect(result.title).toBe('นัดประชุม');
    });

    it('should correctly identify non-task conversation', async () => {
        const result = await analyzeTask('สวัสดีครับ');
        expect(result.isTask).toBe(false);
        expect(result.replyText).toContain('สวัสดี');
    });
});
