import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) return null;

  console.log("[Embedding] Starting");
  console.log(`[Embedding] Input length: ${text.length} characters`);

  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    const values = result.embeddings?.[0]?.values ?? [];

    console.log(`[Embedding] Success — Vector length: ${values.length}`);

    return values;
  } catch (error) {
    console.error("[Embedding] Failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
