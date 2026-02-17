import { FlexMessage } from '@line/bot-sdk';

export function getTaskFlexMessage(title: string, description: string | null): FlexMessage {
    return {
        type: 'flex',
        altText: `New Task Created: ${title}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'NEW TASK CREATED',
                        weight: 'bold',
                        color: '#1DB446',
                        size: 'xs'
                    },
                    {
                        type: 'text',
                        text: title,
                        weight: 'bold',
                        size: 'xl',
                        margin: 'md',
                        wrap: true
                    }
                ],
                paddingAll: '20px',
                backgroundColor: '#ffffff'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: description || 'No description provided.',
                        size: 'sm',
                        color: '#666666',
                        wrap: true,
                        maxLines: 3
                    },
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    {
                                        type: 'text',
                                        text: 'Status',
                                        size: 'xs',
                                        color: '#aaaaaa'
                                    },
                                    {
                                        type: 'text',
                                        text: 'Pending',
                                        size: 'sm',
                                        color: '#333333',
                                        weight: 'bold'
                                    }
                                ]
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    {
                                        type: 'text',
                                        text: 'Date',
                                        size: 'xs',
                                        color: '#aaaaaa'
                                    },
                                    {
                                        type: 'text',
                                        text: new Date().toLocaleDateString('en-GB'),
                                        size: 'sm',
                                        color: '#333333',
                                        weight: 'bold'
                                    }
                                ]
                            }
                        ],
                        margin: 'xl'
                    }
                ],
                paddingAll: '20px',
                backgroundColor: '#ffffff'
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: 'View Dashboard',
                            uri: 'https://liff.line.me/2009152458-0jLBmnkp'
                        },
                        style: 'primary',
                        color: '#101522',
                        height: 'sm'
                    }
                ],
                paddingAll: '20px'
            },
            styles: {
                footer: {
                    separator: true
                }
            }
        }
    };
}
