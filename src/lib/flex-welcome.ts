import { FlexMessage, FlexBubble } from '@line/bot-sdk';

export const getWelcomeFlexMessage = (): FlexMessage => {
    const bubble: FlexBubble = {
        type: 'bubble',
        hero: {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=1000', // Professional Assistant/Concierge Image
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
            action: {
                type: 'uri',
                label: 'Open Website',
                uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`
            }
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: 'Welcome to Kinn',
                    weight: 'bold',
                    size: 'xl',
                    color: '#1F2937' // Charcoal
                },
                {
                    type: 'text',
                    text: 'Your Personal Executive Assistant',
                    weight: 'bold',
                    size: 'sm',
                    color: '#2563EB', // Primary Blue
                    margin: 'xs'
                },
                {
                    type: 'text',
                    text: 'I am here to help you manage your busy life. Just tell me what you need naturally.',
                    margin: 'md',
                    size: 'sm',
                    color: '#666666',
                    wrap: true
                },
                {
                    type: 'separator',
                    margin: 'lg'
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'lg',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'icon',
                                    url: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png', // Checkmark/Task icon
                                    size: 'sm'
                                },
                                {
                                    type: 'text',
                                    text: 'Manage Tasks',
                                    weight: 'bold',
                                    size: 'sm',
                                    color: '#333333',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: '"Remind me to buy milk at 6pm"',
                                    size: 'xs',
                                    color: '#999999',
                                    align: 'end'
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'icon',
                                    url: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png', // Calendar icon
                                    size: 'sm'
                                },
                                {
                                    type: 'text',
                                    text: 'Schedule Events',
                                    weight: 'bold',
                                    size: 'sm',
                                    color: '#333333',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: '"Meeting with John on Friday"',
                                    size: 'xs',
                                    color: '#999999',
                                    align: 'end'
                                }
                            ]
                        }
                    ]
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
                    action: {
                        type: 'uri',
                        label: 'Get Started',
                        uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/?redirect=/dashboard/help`
                    },
                    color: '#2563EB'
                },
                {
                    type: 'button',
                    style: 'secondary',
                    height: 'sm',
                    action: {
                        type: 'uri',
                        label: 'View Dashboard',
                        uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/?redirect=/dashboard`
                    },
                    color: '#E5E7EB' // Gray-200 equivalent
                }
            ]
        }
    };

    return {
        type: 'flex',
        altText: 'Welcome to Kinn - Your Executive Assistant',
        contents: bubble
    };
};
