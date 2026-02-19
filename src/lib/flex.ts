import { FlexMessage } from '@line/bot-sdk';

export function getTaskFlexMessage(title: string, description: string | null, taskId?: string): FlexMessage {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    return {
        type: 'flex',
        altText: `New Task: ${title}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'บันทึกงานใหม่แล้ว ✅',
                        weight: 'bold',
                        color: '#4B6BFB',
                        size: 'sm'
                    },
                    {
                        type: 'text',
                        text: title,
                        weight: 'bold',
                        size: 'xl',
                        margin: 'md',
                        wrap: true
                    },
                    {
                        type: 'text',
                        text: description || 'No description',
                        size: 'sm',
                        color: '#8c8c8c',
                        margin: 'md',
                        wrap: true,
                        maxLines: 2
                    }
                ],
                paddingAll: '20px'
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: 'ดูรายละเอียด',
                            uri: taskId ? `https://liff.line.me/${liffId}/?path=/dashboard/tasks/${taskId}` : `https://liff.line.me/${liffId}/?path=/dashboard/tasks`
                        },
                        style: 'primary',
                        color: '#4B6BFB',
                        height: 'sm'
                    },
                    {
                        type: 'button',
                        action: {
                            type: 'postback',
                            label: 'เสร็จงานนี้',
                            data: taskId ? `action=task_done&id=${taskId}` : 'action=none',
                            displayText: 'ทำเครื่องหมายว่าเสร็จแล้ว'
                        },
                        style: 'secondary',
                        height: 'sm'
                    }
                ],
                paddingAll: '20px'
            }
        }
    };
}

export function getBriefingFlexMessage(summary: string, taskCount: number): FlexMessage {
    return {
        type: 'flex',
        altText: 'Morning Briefing from Kinn',
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'MORNING BRIEFING',
                        weight: 'bold',
                        color: '#4B6BFB',
                        size: 'xs'
                    },
                    {
                        type: 'text',
                        text: 'สวัสดีตอนเช้าครับ! ☀️',
                        weight: 'bold',
                        size: 'xl',
                        margin: 'md'
                    }
                ],
                paddingAll: '20px'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: summary,
                        wrap: true,
                        size: 'sm',
                        color: '#333333'
                    },
                    {
                        type: 'separator',
                        margin: 'xl'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'xl',
                        contents: [
                            {
                                type: 'text',
                                text: `วันนี้คุณมีงานรออยู่ ${taskCount} รายการ`,
                                size: 'xs',
                                color: '#aaaaaa',
                                margin: 'sm'
                            }
                        ]
                    }
                ],
                paddingAll: '20px'
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: 'จัดการงานทั้งหมด',
                            uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/?path=/dashboard/tasks`
                        },
                        style: 'primary',
                        color: '#4B6BFB',
                        height: 'sm'
                    }
                ],
                paddingAll: '20px'
            }
        }
    };
}
