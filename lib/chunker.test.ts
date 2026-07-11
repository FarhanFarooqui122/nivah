import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker";

describe("chunkText", () => {
  it("splits text into chunks of max size", () => {
    const text = "a".repeat(2500);
    const chunks = chunkText(text);
    expect(chunks.length).toBe(3);
    expect(chunks[0].content.length).toBeLessThanOrEqual(1000);
  });

  it("returns one chunk for short text", () => {
    const text = "Hello world";
    const chunks = chunkText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe("Hello world");
  });

  it("returns empty array for empty text", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("preserves whitespace in chunks", () => {
    const chunks = chunkText("   ");
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe("   ");
  });

  it("produces overlapping chunks", () => {
    const text = "a".repeat(1600);
    const chunks = chunkText(text);
    expect(chunks.length).toBe(2);
    expect(chunks[0].content.length).toBe(1000);
    expect(chunks[1].content.length).toBe(800);
  });

  it("numbers chunks sequentially", () => {
    const text = "a".repeat(2500);
    const chunks = chunkText(text);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);
    expect(chunks[2].chunkIndex).toBe(2);
  });

  it("handles text equal to chunk size", () => {
    const text = "a".repeat(1000);
    const chunks = chunkText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe(text);
  });

  it("tracks charCount correctly", () => {
    const text = "Hello world";
    const chunks = chunkText(text);
    expect(chunks[0].charCount).toBe(11);
  });
});
