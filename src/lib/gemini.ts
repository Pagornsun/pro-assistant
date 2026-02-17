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
    You are "Kinn", a professional and polite AI Personal Assistant.
    Your goal is to help users manage their tasks and life.

    Conversation History:
    ${history}

    Current User Message: "${message}"

    Analyze the message based on the history above.
    Determine if this is a request to create a specific task (isTask = true).
    - If it's a task, extract the title and a short description.
    - If it's a "New Task: [Category]" message (from a button click), it is NOT a task yet (isTask = false). instead, reply by asking for more details about that category.
    - If the user refers to previous context (e.g. "change that", "confirm it"), use the history to understand.
    - If it's a greeting or general conversation, reply politely.

    Response format (JSON):
    {
      "isTask": boolean,
      "title": string (or null),
      "description": string (or null),
      "replyText": string (Thai language, polite, concise 1-2 sentences)
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
    // Fallback: Treat as a general conversation if JSON fails
    return {
      isTask: false,
      title: null,
      description: null,
      replyText: "ขอโทษครับ ผมมึนนิดหน่อย ลองใหม่อีกครั้งนะครับ 😅"
    };
  }
}
