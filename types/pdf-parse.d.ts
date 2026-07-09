declare module "pdf-parse" {
  interface PDFParseOptions {
    data: Uint8Array;
    verbosity?: number;
  }

  interface PDFPageText {
    text: string;
    num: number;
  }

  interface PDFParseResult {
    pages: PDFPageText[];
    text: string;
    total: number;
  }

  export class PDFParse {
    constructor(options: PDFParseOptions);
    load(): Promise<void>;
    getText(): Promise<PDFParseResult>;
    destroy(): void;
  }
}

declare module "mammoth" {
  interface ExtractRawTextResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(options: { buffer: Buffer }): Promise<ExtractRawTextResult>;
}