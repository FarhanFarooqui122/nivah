export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string | null> {
  const type = mimeType.toLowerCase();
  const ext = fileName.toLowerCase().split(".").pop() || "";

  console.log("MIME TYPE:", mimeType);

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
      const extracted = result.text?.trim() || null;
      console.log("[extractText] PDF extraction result length:", extracted?.length);

      const MIN_TEXT_LENGTH = 20;
      if (extracted && extracted.length >= MIN_TEXT_LENGTH) {
        return extracted;
      }

      console.log("[extractText] PDF text insufficient, falling back to OCR...");
      return await ocrPdf(buffer);
    }

    if (
      type.includes("word") ||
      type.includes("officedocument") ||
      ext === "docx"
    ) {
      const { extractRawText } = await import("mammoth");
      const result = await extractRawText({ buffer });
      console.log("[extractText] DOCX extraction result length:", result.value?.length);
      return result.value || null;
    }

    if (type === "text/plain" || type === "text/markdown" || type === "text/x-markdown") {
      return buffer.toString("utf-8");
    }

    if (ext === "txt" || ext === "text" || ext === "md" || ext === "markdown") {
      return buffer.toString("utf-8");
    }

    if (
      type === "image/png" ||
      type === "image/jpeg" ||
      type === "image/jpg" ||
      type === "image/webp"
    ) {
      console.log("OCR STARTED");

      const path = await import("path");
      const workerScript = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { workerPath: workerScript });

      const { data } = await worker.recognize(buffer);
      await worker.terminate();

      console.log("OCR DATA KEYS:", Object.keys(data));
      console.log("OCR TEXT RAW:", JSON.stringify(data.text));
      console.log("OCR CONFIDENCE:", data.confidence);
      console.log("OCR BLOCKS:", JSON.stringify(data.blocks));

      const text = data.text?.trim() || null;
      console.log("OCR RESULT:", text);

      return text;
    }

    return null;
  } catch (error) {
    console.error("[extractText] Extraction failed:", {
      fileName,
      mimeType,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

async function ocrPdf(buffer: Buffer): Promise<string | null> {
  const pdfjs = await import("pdfjs-dist");
  const { createCanvas } = await import("@napi-rs/canvas");
  const { createWorker } = await import("tesseract.js");
  const path = await import("path");

  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data }).promise;

  const workerScript = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );
  const worker = await createWorker("eng", 1, { workerPath: workerScript });

  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
      const pngBuf = canvas.toBuffer("image/png");
      const { data: ocrData } = await worker.recognize(pngBuf);
      const pageText = ocrData.text?.trim();
      if (pageText) {
        pages.push(pageText);
      }
    }
    if (pages.length === 0) return null;
    return pages.join("\n\n");
  } finally {
    await worker.terminate();
  }
}