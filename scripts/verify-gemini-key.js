
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load env vars
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

const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ Missing GEMINI_API_KEY');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
    console.log('Testing Gemini API with new Key...');
    console.log(`Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent('Say "Hello World" if you can hear me.');
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini Response:', text);
    } catch (error) {
        console.error('❌ API Error:', error.message);
        if (error.status) console.error('Status:', error.status);
    }
}

testGemini();
