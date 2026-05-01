import { GoogleGenAI, Type } from "@google/genai";
import { Interest } from "./types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will be disabled.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
}

export async function analyzeInterests(interests: Interest[]) {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze these interests to find the "Golden Thread" — the invisible connection between them.
    
    Interests:
    ${interests.map(i => `- ${i.name}: ${i.why}`).join('\n')}
    
    Tasks:
    1. For each interest, provide a "Deep Dive" (1-2 sentences) exploring why it's significant and what meta-skill it develops.
    2. Analyze the synergy between pairs of interests (max 5 key pairs).
    3. Determine a core "Golden Thread" statement.
    4. Generate content for a "Personality Mind Map" in Markdown format.
    
    Return the response as JSON with the following structure:
    {
      "deepDives": { "interestName": "analysis..." },
      "synergies": [ { "a": "interestA", "b": "interestB", "desc": "why they amplify each other", "score": 0.9 } ],
      "goldenThread": "The core theme...",
      "mindMap": "# Personality Mind Map\\n\\n## Interests\\n...\\n\\n## Connectivity\\n..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deepDives: {
              type: Type.OBJECT,
              additionalProperties: { type: Type.STRING }
            },
            synergies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  a: { type: Type.STRING },
                  b: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                },
                required: ["a", "b", "desc", "score"]
              }
            },
            goldenThread: { type: Type.STRING },
            mindMap: { type: Type.STRING }
          },
          required: ["deepDives", "synergies", "goldenThread", "mindMap"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
