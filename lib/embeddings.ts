import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) return null;

  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    const values = result.embeddings?.[0]?.values ?? [];

    return values;
  } catch (error) {
    console.error("[Embedding] Failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
