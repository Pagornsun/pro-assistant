import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeTask(message: string) {
  const prompt = `
    You are an AI assistant for "ProAssistant", a personal assistant service.
    Analyze the following user request and determine if it's a task.
    If it is a task, extract the title and a short description.
    
    User Message: "${message}"
    
    Response format (JSON):
    {
      "isTask": boolean,
      "title": string,
      "description": string,
      "reason": string
    }
  `;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}
