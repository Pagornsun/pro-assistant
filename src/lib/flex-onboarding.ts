import { FlexMessage } from '@line/bot-sdk';

const PRIMARY_COLOR = '#06C755';
const TEXT_COLOR = '#2D3436';
const SUBTEXT_COLOR = '#636E72';

interface OnboardingStepConfig {
    title: string;
    description: string;
    buttonLabel: string;
    buttonAction: string;
    isLastStep: boolean;
}

const ONBOARDING_STEPS: Record<number, OnboardingStepConfig> = {
    1: {
        title: "ยินดีต้อนรับสู่ ProAssistant! 👋",
        description: "ผู้ช่วยส่วนตัวอัจฉริยะที่จะช่วยให้ชีวิตของคุณง่ายขึ้น\n\n✅ จดบันทึกงาน\n✅ แจ้งเตือนความจำ\n✅ บันทึกรายจ่ายจากสลิป",
        buttonLabel: "เริ่มใช้งานกันเลย!",
        buttonAction: "tutorial_next_1",
        isLastStep: false
    },
    2: {
        title: "1. จดงานง่ายๆ แค่พิมพ์บอก",
        description: "ไม่ต้องเข้าแอปฯ แค่พิมพ์บอกผมได้เลย เช่น:\n\n💬 \"พรุ่งนี้ 10 โมง ประชุมทีม\"\n💬 \"เตือนซื้อนมตอนเย็น\"\n💬 \"จ่ายค่าไฟ 2500 บาท\"",
        buttonLabel: "ลองพิมพ์ดูสิ / ถัดไป",
        buttonAction: "tutorial_next_2",
        isLastStep: false
    },
    3: {
        title: "2. บันทึกรายจ่ายอัตโนมัติ",
        description: "แค่ส่งรูปสลิปโอนเงินเข้ามา ผมจะอ่านยอดเงินและบันทึกให้ทันที! 📸💰\n\nลองส่งรูปสลิปมาได้เลยครับ",
        buttonLabel: "เข้าใจแล้ว / ถัดไป",
        buttonAction: "tutorial_next_3",
        isLastStep: false
    },
    4: {
        title: "พร้อมใช้งานแล้ว! 🎉",
        description: "คุณสามารถกดเมนูด้านล่างเพื่อดูปฏิทิน หรือสรุปงานได้ตลอดเวลาครับ\n\nขอให้มีความสุขกับการจัดการชีวิตนะครับ!",
        buttonLabel: "เริ่มใช้งานจริง",
        buttonAction: "tutorial_finish",
        isLastStep: true
    }
};

export const getOnboardingFlexMessage = (step: number = 1): FlexMessage => {
    const config = ONBOARDING_STEPS[step];

    if (!config) {
        return { type: 'text', text: 'Error loading tutorial.' } as unknown as FlexMessage;
    }

    const { title, description, buttonLabel, buttonAction, isLastStep } = config;

    return {
        type: 'flex',
        altText: `ProAssistant Tutorial (${step}/4)`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: `Tutorial ${step}/4`,
                        color: PRIMARY_COLOR,
                        weight: 'bold',
                        size: 'xs',
                        margin: 'none'
                    },
                    {
                        type: 'text',
                        text: title,
                        weight: 'bold',
                        size: 'xl',
                        color: TEXT_COLOR,
                        margin: 'md',
                        wrap: true
                    }
                ],
                paddingBottom: 'none'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: description,
                        color: SUBTEXT_COLOR,
                        size: 'sm',
                        wrap: true,
                        lineSpacing: '4px'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [],
                        margin: 'xl'
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        height: 'sm',
                        color: PRIMARY_COLOR,
                        action: {
                            type: 'postback',
                            label: buttonLabel,
                            data: `action=${buttonAction}`
                        }
                    },
                    ...(isLastStep ? [] : [{
                        type: 'button',
                        style: 'link',
                        height: 'sm',
                        color: SUBTEXT_COLOR,
                        action: {
                            type: 'postback',
                            label: "ข้าม (Skip)",
                            data: "action=tutorial_skip"
                        }
                    } as const])
                ]
            }
        }
    };
};
