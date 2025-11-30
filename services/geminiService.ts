import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Task, ReceiptData, InsightResult, TimeBlock } from "../types";

// Helper to get AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean AI response text (remove markdown code blocks)
const parseAIJSON = <T>(text: string): T => {
  try {
    // Remove ```json and ``` markers
    const cleaned = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("JSON Parse Error on text:", text);
    throw e;
  }
};

/**
 * Analyzes a receipt image to extract transaction details.
 * Uses gemini-3-pro-preview for complex image understanding.
 */
export const analyzeReceipt = async (base64Image: string): Promise<ReceiptData> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this receipt image. Extract the Merchant Name, Total Amount (assume Philippine Peso PHP if not specified), Date, and a likely Category (e.g., Food, Transport, Utilities, Shopping). Return the result as JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            total: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return parseAIJSON<ReceiptData>(response.text);
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};

/**
 * Prioritizes a list of tasks using AI reasoning.
 * Uses gemini-3-pro-preview for advanced reasoning.
 */
export const prioritizeTasksAI = async (currentTasks: Task[]): Promise<Task[]> => {
  const ai = getAI();
  const tasksJson = JSON.stringify(currentTasks);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert productivity manager. Reorder and update the priority fields of the following tasks based on urgency and implied importance. 
      
      Tasks: ${tasksJson}
      
      Return a JSON array of the same tasks, but reordered and with potentially updated 'priority' fields (High, Medium, Low).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
              estimatedTime: { type: Type.STRING },
              status: { type: Type.STRING, enum: ['todo', 'in-progress', 'done'] },
              dueDate: { type: Type.STRING, nullable: true }
            }
          }
        }
      }
    });

    if (response.text) {
      return parseAIJSON<Task[]>(response.text);
    }
    return currentTasks;
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    throw error;
  }
};

/**
 * General chat interaction.
 * Uses gemini-3-pro-preview.
 */
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string): Promise<string> => {
  const ai = getAI();
  
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are a helpful and intelligent assistant for a combined Financial and Time Management dashboard app designed for Filipinos. Use Philippine Peso (₱) for currency examples. You can help users analyze their spending habits, suggest schedules, and provide productivity tips. Keep answers concise and helpful."
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error connecting to Gemini.";
  }
};

/**
 * Suggest a schedule workflow based on tasks.
 * Uses gemini-2.5-flash for speed.
 */
export const suggestWorkflow = async (tasks: Task[]): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here are my tasks: ${JSON.stringify(tasks)}. Suggest a 3-sentence summary of how I should structure my day to be most efficient.`
        });
        return response.text || "Focus on your highest priority tasks first.";
    } catch (e) {
        return "Focus on your high priority tasks.";
    }
}

/**
 * Generates financial advice for a specific goal.
 * Uses gemini-3-pro-preview for detailed planning.
 */
export const getFinancialGoalAdvice = async (
  goal: { title: string; targetAmount: number; deadline: string },
  context: { income: number; expense: number }
): Promise<string> => {
  const ai = getAI();
  try {
    const prompt = `
      I am a Filipino user planning a financial goal.
      Goal: ${goal.title}
      Target Amount: ₱${goal.targetAmount}
      Deadline: ${goal.deadline}
      
      My current monthly context:
      Total Income: ₱${context.income}
      Total Expenses: ₱${context.expense}

      Please provide a concise, personalized plan (3-4 bullet points) on how I can achieve this. 
      Include a recommended monthly savings amount. 
      Be realistic about Filipino living costs if relevant.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });

    return response.text || "Save consistently and review your expenses.";
  } catch (error) {
    console.error("Error generating goal advice:", error);
    return "Unable to generate advice at the moment. Try to save 20% of your income.";
  }
};

/**
 * Cross-functional analysis of time and money.
 * Uses gemini-3-pro-preview to find patterns.
 */
export const generateCrossFunctionalInsights = async (
  transactions: Transaction[], 
  tasks: Task[]
): Promise<InsightResult> => {
  const ai = getAI();
  
  const dataContext = JSON.stringify({
    transactions: transactions.slice(0, 30), // Limit to recent 30 to save tokens if list is huge
    tasks: tasks.slice(0, 30)
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Analyze the following user data which includes Financial Transactions (in Philippine Peso) and Productivity Tasks.
        
        Data: ${dataContext}
        
        Identify correlations between work habits and spending behavior. 
        Examples of what to look for:
        - Do stressful/busy days (High priority tasks) correlate with convenience food spending?
        - Does income type relate to specific task categories?
        - Are there 'burnout spending' patterns?

        Return a JSON object with:
        1. 'summary': A brief 2-sentence overview of the financial-productivity health.
        2. 'correlations': An array of 3 specific observations linking time and money.
        3. 'recommendation': One actionable tip to improve balance.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            correlations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return parseAIJSON<InsightResult>(response.text);
    }
    throw new Error("No insight generated");
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      summary: "We couldn't generate a detailed analysis right now.",
      correlations: ["Try tracking more tasks and expenses to see patterns."],
      recommendation: "Focus on tracking your daily habits."
    };
  }
};

/**
 * Generates a Smart Time Blocking schedule.
 * Uses gemini-3-pro-preview.
 */
export const generateSmartSchedule = async (
  tasks: Task[], 
  config: { start: string; end: string; energy: string }
): Promise<TimeBlock[]> => {
  const ai = getAI();
  const tasksJson = JSON.stringify(tasks.filter(t => t.status !== 'done')); // Only plan pending tasks

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Create a detailed daily schedule (Time Blocking) for a user.
        
        User Config:
        - Work Start: ${config.start}
        - Work End: ${config.end}
        - Current Energy Level: ${config.energy} (High energy means schedule hard tasks first. Low energy means easier tasks or breaks first).
        
        Pending Tasks: ${tasksJson}
        
        Rules:
        1. Fit tasks into the time window.
        2. Include short breaks.
        3. Group similar tasks if possible.
        4. "Deep Work" blocks for High priority tasks.
        
        Return a JSON array of blocks. Each block has:
        - id: string
        - startTime: string (HH:MM 24h)
        - endTime: string (HH:MM 24h)
        - title: string (Task name or activity like "Lunch")
        - type: 'focus' | 'meeting' | 'break' | 'admin'
        - suggestionReason: string (Why this time? e.g. "High energy peak for deep work")
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['focus', 'meeting', 'break', 'admin'] },
              suggestionReason: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return parseAIJSON<TimeBlock[]>(response.text);
    }
    throw new Error("No schedule generated");
  } catch (error) {
    console.error("Error generating schedule:", error);
    return [];
  }
};