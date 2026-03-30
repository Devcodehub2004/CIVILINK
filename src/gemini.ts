import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

const getAIClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const analyzeIssueWithAI = async (title: string, description: string) => {
  try {
    const ai = getAIClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze this civic issue:
      Title: "${title}"
      Description: "${description}"

      Return ONLY a JSON object with:
      1. "category": Must be one of [ROAD, WATER, ELECTRICITY, SANITATION, OTHER]
      2. "isCritical": true if it's an immediate danger (fire, flood, open wires), else false.

      Example: {"category": "ROAD", "isCritical": false}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Gemini Error:", error);
  }
  return null;
};

export const generateAISummary = async (issues: any[]) => {
  try {
    const ai = getAIClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const issuesList = issues.map(i => `- ${i.title}: ${i.description}`).join('\n');
    const prompt = `
      Summarize the following civic issues for an administrator.
      Highlight trends, any clusters of similar problems, and the most urgent cases.
      Keep it concise and professional.

      Issues:
      ${issuesList}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Summary Error:", error);
    return "Error generating summary.";
  }
};
