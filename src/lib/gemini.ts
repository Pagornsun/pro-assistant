import { GoogleGenerativeAI } from "@google/generative-ai";

// Hardcoded for safety
const apiKey = 'AIzaSyCJp-_TRQOm5pYZXBSJtbV6idZ0j6SvJiI';

if (!apiKey) {
  console.error("Warning: GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyzeTask(message: string) {
  const prompt = `
    You are "Kinn", a professional and polite AI Personal Assistant.
    Your goal is to help users manage their tasks and life.

    Analyze the following user message:
    
    User Message: "${message}"

    Determine if this is a request to create a specific task (isTask = true).
    - If it's a task, extract the title and a short description.
    - If it's a "New Task: [Category]" message (from a button click), it is NOT a task yet (isTask = false). instead, reply by asking for more details about that category.
    - If it's a greeting or general conversation, reply politely.

    Response format (JSON):
    {
      "isTask": boolean,
      "title": string (or null),
      "description": string (or null),
      "replyText": string (Thai language, polite, concise 1-2 sentences)
    }
  `;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}
