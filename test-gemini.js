/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hardcoded Key
const apiKey = 'AIzaSyCJp-_TRQOm5pYZXBSJtbV6idZ0j6SvJiI';

async function testGemini() {
    console.log("Testing API Key:", apiKey);

    // 1. Try raw REST API to list models (The most direct check)
    try {
        console.log("\n📡 Listing models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ API Key works! Found", data.models?.length || 0, "models.");

        // Print available models
        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name}`);
                }
            });
        }

    } catch (error) {
        console.error("\n❌ API Key Error:");
        console.error(error.message);
        console.log("\nIf this failed (400 or 403), your API Key is invalid or not enabled for Google AI Studio.");
        console.log("Please regenerate a key at: https://aistudio.google.com/app/apikey");
    }

    // 2. Try the SDK with a fallback model if list succeeded
    try {
        const modelName = "gemini-pro";
        console.log(`\n🤖 Attempting SDK generation with: ${modelName}...`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log("✅ SDK Success! Response:", response.text());

    } catch (error) {
        console.error("❌ SDK Error:", error.message);
    }
}

testGemini();
