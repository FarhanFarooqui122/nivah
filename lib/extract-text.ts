export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string | null> {
  const type = mimeType.toLowerCase();
  const ext = fileName.toLowerCase().split(".").pop() || "";

  try {
    if (type === "application/pdf" || ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({
        data: new Uint8Array(buffer),
        verbosity: 0,
      });
      await parser.load();
      const result = await parser.getText();
      parser.destroy();
      return result.text || null;
    }

    if (
      type.includes("word") ||
      type.includes("officedocument") ||
      ext === "docx"
    ) {
      const { extractRawText } = await import("mammoth");
      const result = await extractRawText({ buffer });
      return result.value || null;
    }

    if (type === "text/plain" || type === "text/markdown" || type === "text/x-markdown") {
      return buffer.toString("utf-8");
    }

    if (ext === "txt" || ext === "text" || ext === "md" || ext === "markdown") {
      return buffer.toString("utf-8");
    }

    return null;
  } catch (error) {
    console.error("Text extraction failed:", {
      fileName,
      mimeType,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}