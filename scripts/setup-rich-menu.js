
const fs = require('fs');
const path = require('path');
const { Client } = require('@line/bot-sdk');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[key.trim()] = value;
    }
});

const config = {
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_CHANNEL_SECRET
};

const client = new Client(config);

const richMenuObject = {
    size: {
        width: 2500,
        height: 1686
    },
    selected: true,
    name: 'ProAssistant Main Menu',
    chatBarText: 'Menu',
    areas: [
        // Top Left: New Task
        {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: 'message', text: 'New Task' }
        },
        // Top Center: Calendar
        {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: 'uri', uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}/?redirect=/dashboard/calendar` }
        },
        // Top Right: Dashboard
        {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: 'uri', uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}/?redirect=/dashboard` }
        },
        // Bottom Left: History/View All
        {
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: 'uri', uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}/?redirect=/dashboard/tasks` }
        },
        // Bottom Center: Help
        {
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: 'uri', uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}/?redirect=/dashboard/help` }
        },
        // Bottom Right: Settings
        {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: 'uri', uri: `https://liff.line.me/${env.NEXT_PUBLIC_LIFF_ID}/?redirect=${encodeURIComponent('/dashboard?settings=true')}` }
        }
    ]
};

async function setup() {
    try {
        console.log('1. Creating Rich Menu...');
        const richMenuId = await client.createRichMenu(richMenuObject);
        console.log('   ID:', richMenuId);

        console.log('2. Processing Image...');
        const imagePath = path.resolve(__dirname, '../public/rich-menu.png');
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image not found at ${imagePath}`);
        }

        // Resize image using Jimp
        const Jimp = require('jimp');
        const image = await Jimp.read(imagePath);

        console.log(`   Original Size: ${image.getWidth()}x${image.getHeight()}`);
        if (image.getWidth() !== 2500 || image.getHeight() !== 1686) {
            console.log('   Resizing to 2500x1686...');
            await image.resize(2500, 1686);
            await image.writeAsync(imagePath); // Overwrite with resized version
            console.log('   Resize Complete.');
        } else {
            console.log('   Size is already correct.');
        }

        console.log('3. Uploading Image...');
        await client.setRichMenuImage(richMenuId, fs.createReadStream(imagePath));
        console.log('   Image Uploaded.');

        console.log('4. Setting as Default...');
        await client.setDefaultRichMenu(richMenuId);
        console.log('   Done! Rich Menu is now active.');

    } catch (e) {
        console.error('Error:', e.message);
        if (e.originalError) console.error('Details:', e.originalError.response?.data);
    }
}

setup();
