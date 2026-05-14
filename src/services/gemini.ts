import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const geminiService = {
  async getMatchAnalysis(teamA: string, teamB: string, sport: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a short, high-energy 2-sentence analysis for a ${sport} match between ${teamA} and ${teamB}. Mention a key player or strategy. Keep it fan-centric.`,
      });
      return response.text || "No analysis available.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Get ready for an epic showdown!";
    }
  },

  async getPersonalizedRewardMessage(displayName: string, streak: number, points: number) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `A fan named ${displayName} has reached a streak of ${streak} correct predictions and currently has ${points} points. Write a short, motivating, 1-sentence "praise" message from the 'System' to keep them engaged.`,
      });
      return response.text || "Keep up the amazing work!";
    } catch (error) {
      console.error("Gemini Reward Error:", error);
      return "You're on fire! Keep it up!";
    }
  }
};
