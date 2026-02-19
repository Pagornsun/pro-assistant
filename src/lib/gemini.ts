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
        - Extract total amount, currency (default THB), and number of people.
    
    2. If NOT a bill split, check if it is a request to CREATE A TASK.
        - If yes, set isTask = true.
        - Extract title and description.
        - Extract due_date: Look for time expressions like "พรุ่งนี้", "วันจันทร์หน้า", "10 โมง", "next week". Convert to ISO8601 strings if possible, otherwise null. Current local time is ${new Date().toISOString()}.
        - Extract tags: Suggest 1-3 relevant Thai tags (e.g., #งาน, #ส่วนตัว, #จ่ายเงิน).
        - Extract priority: "high", "medium", or "low" based on urgency words.

    3. If neither, it is general conversation.

    Response format (JSON):
    {
      "isTask": boolean,
      "isBillSplit": boolean,
      "title": string (or null),
      "description": string (or null),
      "due_date": string (ISO8601 or null),
      "tags": string[],
      "priority": "high" | "medium" | "low",
      "billDetails": {
        "total": number (or null),
        "currency": string,
        "people_count": number,
        "payers": string[]
      },
      "replyText": string (Thai language, polite, concise)
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
    Analyze this image. It could be a Thai Bank Transfer Slip, a handwritten note, or a screenshot of a schedule.
    Extract any tasks, plans, or expenses in JSON format:
    {
        "is_slip": boolean,
        "is_task": boolean,
        "amount": number (if slip),
        "date": string (ISO8601 or null),
        "receiver": string (if slip),
        "sender": string (if slip),
        "extracted_tasks": [
            { "title": string, "description": string, "due_date": string (null if unknown) }
        ]
    }
    If it is NOT a slip AND contains no readable tasks, set both is_slip and is_task to false.
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

export async function generateBriefing(tasks: any[]) {
  const taskListText = tasks.map(t => `- ${t.title} (${t.priority || 'medium'})`).join('\n');
  const prompt = `
    You are "Kinn", a professional AI Personal Assistant (Thai language).
    Here are the tasks for the user today:
    ${taskListText}

    Write a polite, encouraging, and concise morning briefing (2-3 sentences).
    Mention the number of tasks and highlight if there are high priority ones.
    Be friendly but professional. Do not use markdown (except newlines).
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (e) {
    console.error("Gemini Briefing Generation Failed:", e);
    return `สวัสดีครับ วันนี้คุณมีงาน ${tasks.length} รายการที่ต้องจัดการครับ สู้ๆ นะครับ!`;
  }
}

