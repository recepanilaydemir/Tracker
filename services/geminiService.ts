import { GoogleGenAI } from "@google/genai";
import { Habit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHabitInsights = async (habits: Habit[]): Promise<string> => {
  try {
    // Simplify data for the model to reduce token usage
    const habitsSummary = habits.map(h => {
      const logDates = Object.keys(h.logs).sort();
      const total = logDates.length;
      const lastLog = logDates[logDates.length - 1] || 'Never';
      
      // Calculate basic streak (simplified for context)
      // Real streak calc would happen here in a robust app
      return {
        name: h.name,
        totalCompletions: total,
        lastActive: lastLog,
        // Send last 14 days of history for pattern recognition
        recentHistory: logDates.slice(-14)
      };
    });

    const prompt = `
      You are a supportive and analytical Habit Coach. 
      Analyze the following user habit data: ${JSON.stringify(habitsSummary)}.
      
      Provide a concise summary (max 3 sentences) acknowledging their consistency or offering a gentle specific tip to improve. 
      Focus on patterns. If they are doing well, celebrate it. If they are struggling, suggest a small actionable step.
      Do not use markdown formatting like bolding or headers. Keep it conversational.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Keep going! Consistency is key.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this moment. Keep tracking!";
  }
};