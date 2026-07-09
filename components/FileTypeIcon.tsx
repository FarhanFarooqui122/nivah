import {
  FileIcon,
  PdfIcon,
  ImageIcon,
  CodeIcon,
  ArchiveIcon,
  SpreadsheetIcon,
  PresentationIcon,
  DocumentIcon,
} from "@/components/Icons";
import { type ReactNode } from "react";

export function FileTypeIcon({ fileType, className = "w-5 h-5" }: { fileType: string; className?: string }) {
  const type = fileType.toLowerCase();

  if (type.includes("pdf")) return <PdfIcon className={className} />;
  if (type.includes("word") || type.includes("docx")) return <DocumentIcon className={className} />;
  if (type.includes("text") || type.includes("txt") || type.includes("markdown")) return <FileIcon className={className} />;
  if (type.includes("image")) return <ImageIcon className={className} />;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return <SpreadsheetIcon className={className} />;
  if (type.includes("presentation") || type.includes("powerpoint")) return <PresentationIcon className={className} />;
  if (type.includes("zip") || type.includes("archive") || type.includes("rar")) return <ArchiveIcon className={className} />;
  if (type.includes("javascript") || type.includes("typescript") || type.includes("python") || type.includes("html")) return <CodeIcon className={className} />;
  if (type.includes("json")) return <CodeIcon className={className} />;
  return <FileIcon className={className} />;
}