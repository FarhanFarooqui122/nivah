import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export const EMBEDDING_DIMENSIONS = 3072;

const EMBEDDING_CONCURRENCY = 8;

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  let cursor = 0;

  const worker = async () => {
    while (cursor < texts.length) {
      const index = cursor;
      cursor++;
      results[index] = await generateEmbedding(texts[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(EMBEDDING_CONCURRENCY, texts.length) }, () => worker())
  );

  return results;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) return null;

  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    const values = result.embeddings?.[0]?.values ?? [];

    if (!values || values.length !== EMBEDDING_DIMENSIONS) {
      console.error(
        `[Embedding] Unexpected vector length: got ${values.length}, expected ${EMBEDDING_DIMENSIONS}`
      );
      return null;
    }

    return values;
  } catch (error) {
    console.error("[Embedding] Failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
