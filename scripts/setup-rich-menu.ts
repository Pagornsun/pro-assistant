
import { Client } from '@line/bot-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
const liffUrl = `https://liff.line.me/${liffId}`;

const richMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Kinn Pro Menu",
    chatBarText: "Menu",
    areas: [
        {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: "uri", label: "New Task", uri: `${liffUrl}/?path=/dashboard/tasks` }
        },
        {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: "uri", label: "All Tasks", uri: `${liffUrl}/?path=/dashboard/tasks` }
        },
        {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: "uri", label: "Calendar", uri: `${liffUrl}/?path=/dashboard/calendar` }
        },
        {
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: "message", label: "Summary", text: "ช่วยสรุปงานวันนี้ให้หน่อย" }
        },
        {
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: "uri", label: "Profile", uri: `${liffUrl}/?path=/dashboard/profile` }
        },
        {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: "uri", label: "Upgrade", uri: `${liffUrl}/?path=/dashboard/subscription` }
        }
    ]
};

async function main() {
    try {
        console.log("Setting up Rich Menu...");

        // 1. Create Rich Menu
        const richMenuId = await client.createRichMenu(richMenu as any);
        console.log("Created Rich Menu ID:", richMenuId);

        // 2. Upload Image (Placeholder or actual file)
        // Usually you need a 2500x1686 image.
        // I will provide the command to the user since I can't upload local images easily here.
        console.log("\nNext Steps:");
        console.log(`1. Upload a 2500x1686 image to this Rich Menu ID.`);
        console.log(`2. Set as Default Rich Menu: client.setDefaultRichMenu('${richMenuId}')`);

    } catch (e) {
        console.error("Setup Failed:", e);
    }
}

main();
