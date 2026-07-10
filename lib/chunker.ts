const CHUNK_SIZE = 1000;
const OVERLAP = 200;
const STEP = CHUNK_SIZE - OVERLAP;

export interface Chunk {
  content: string;
  chunkIndex: number;
  charCount: number;
}

export function chunkText(text: string): Chunk[] {
  if (!text || text.length === 0) return [];

  const chunks: Chunk[] = [];
  let index = 0;

  while (index < text.length) {
    const end = Math.min(index + CHUNK_SIZE, text.length);
    const content = text.slice(index, end);

    chunks.push({
      content,
      chunkIndex: chunks.length,
      charCount: content.length,
    });

    if (end === text.length) break;

    index += STEP;
  }

  return chunks;
}
