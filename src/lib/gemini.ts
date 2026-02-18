import { GoogleGenerativeAI } from "@google/generative-ai";

// Load from environment variable (Best Practice)
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error("Warning: GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyzeTask(message: string, history: string = '') {
  const prompt = `
    You are "Kinn", a professional and polite AI Personal Assistant (Thai language).
    Your goal is to help users manage tasks, expenses, and bill splitting.

    Conversation History:
    ${history}

    Current User Message: "${message}"

    Analyze the message based on the history above.
    
    1. Check if this is a request to SPLIT A BILL (e.g. "ค่าข้าว 500 หาร 3", "Dinner 1000 split 4", "หารค่าไฟ").
        - If yes, set isBillSplit = true.
        - Extract total amount, currency (default THB), and number of people (if specified).
        - If payers are mentioned (e.g. @A @B), list them.
    
    2. If NOT a bill split, check if it is a request to CREATE A TASK.
        - If yes, set isTask = true.
        - Extract title and description.

    3. If neither, it is general conversation.

    Response format (JSON):
    {
      "isTask": boolean,
      "isBillSplit": boolean,
      "title": string (or null),
      "description": string (or null),
      "billDetails": {
        "total": number (or null),
        "currency": string (default "THB"),
        "people_count": number (default 1 if not specified but implies split),
        "payers": string[] (names/mentions)
      },
      "replyText": string (Thai language, polite, concise 1-2 sentences. If bill split, summarize e.g. "Total 500, 125 per person")
    }
  `;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" } // Force JSON mode
  });

  const response = await result.response;
  const text = response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", text);
    // Fallback
    return {
      isTask: false,
      isBillSplit: false,
      title: null,
      description: null,
      billDetails: null,
      replyText: "ขอโทษครับ ผมมึนนิดหน่อย ลองใหม่อีกครั้งนะครับ 😅"
    };
  }
}

export async function analyzeImage(imageBuffer: Buffer, mimeType: string) {
  // Use 1.5-flash for vision or 2.0-flash? The prompt was set to 2.0-flash above.
  // 2.0-flash is better.
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Analyze this image. It is likely a Thai Bank Transfer Slip.
    Extract the following details in JSON format:
    {
        "is_slip": boolean,
        "amount": number,
        "date": string (ISO8601 or null),
        "receiver": string (Name or Bank),
        "sender": string (Name or Bank)
    }
    If it is NOT a slip, set is_slip to false.
    `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Gemini Image Analysis Failed:", e);
    return { is_slip: false };
  }
}
