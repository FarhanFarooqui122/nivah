import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/DashboardComponents";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import {
  FileIcon, FolderIcon, ImageIcon, DocumentIcon, CopyIcon,
  UploadIcon, PdfIcon, SettingsIcon,
} from "@/components/Icons";
import { formatRelativeTime } from "@/lib/utils";
import { AnimatedSection } from "@/components/AnimatedSection";
import { PageHeader } from "@/components/dashboard/PageHeader";
import Link from "next/link";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const TEXT_TYPES = ["text/plain", "text/markdown"];
const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function categorizeFileType(fileType: string): string {
  if (fileType === PDF_TYPE) return "PDF";
  if (fileType === DOCX_TYPE) return "DOCX";
  if (TEXT_TYPES.includes(fileType)) return "TXT/MD";
  if (IMAGE_TYPES.includes(fileType)) return "Images";
  return "Other";
}

function getFileTypeLabel(fileType: string): string {
  const lower = fileType.toLowerCase();
  if (lower.includes("pdf")) return "PDF";
  if (lower.includes("docx") || lower.includes("word")) return "DOCX";
  if (lower.includes("markdown")) return "MD";
  if (lower.includes("text") || lower.includes("txt")) return "TXT";
  if (lower.includes("png")) return "PNG";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "JPEG";
  if (lower.includes("webp")) return "WebP";
  return fileType;
}

function countWords(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return <div>No email found</div>;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: userId, email },
    });
  }

  const whereUser = { userId: user.id };

  const [totalDocuments, totalImages] = await Promise.all([
    prisma.document.count({ where: whereUser }),
    prisma.document.count({
      where: { ...whereUser, fileType: { in: IMAGE_TYPES } },
    }),
  ]);

  const fileInfos = await prisma.document.findMany({
    where: whereUser,
    select: { fileType: true, title: true, fileName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const textDocs = await prisma.document.findMany({
    where: { ...whereUser, textContent: { not: null } },
    select: { title: true, fileName: true, fileType: true, textContent: true },
  });

  const totalWords = textDocs.reduce((sum, doc) => sum + countWords(doc.textContent), 0);

  const storageBreakdown: Record<string, number> = {};
  const fileTypeCounts = new Map<string, number>();

  fileInfos.forEach((doc) => {
    const cat = categorizeFileType(doc.fileType);
    storageBreakdown[cat] = (storageBreakdown[cat] || 0) + 1;
    fileTypeCounts.set(doc.fileType, (fileTypeCounts.get(doc.fileType) || 0) + 1);
  });

  const mostRecentUpload = fileInfos.length > 0
    ? { title: fileInfos[0].title, fileName: fileInfos[0].fileName, createdAt: fileInfos[0].createdAt }
    : null;

  const sortedByContent = [...textDocs].sort(
    (a, b) => (b.textContent?.length || 0) - (a.textContent?.length || 0)
  );

  const largestDocument = sortedByContent.length > 0
    ? {
        title: sortedByContent[0].title,
        fileName: sortedByContent[0].fileName,
        fileType: sortedByContent[0].fileType,
        charCount: sortedByContent[0].textContent?.length ?? 0,
      }
    : null;

  const commonFileTypeInfo: { fileType: string; count: number } | null = fileTypeCounts.size > 0
    ? Array.from(fileTypeCounts.entries()).reduce((max, entry) =>
        entry[1] > max.count ? { fileType: entry[0], count: entry[1] } : max,
        { fileType: "", count: 0 }
      )
    : null;

  const topDocuments = sortedByContent.slice(0, 5).map((doc) => ({
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    charCount: doc.textContent?.length ?? 0,
  }));

  const hasDocuments = fileInfos.length > 0;

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <PageHeader
          kicker="Overview"
          title="Memory overview"
          description={`Welcome back, ${clerkUser?.firstName || email.split("@")[0]}. Here is what your memory layer is holding.`}
        />
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Documents" value={totalDocuments} icon={<FileIcon className="w-6 h-6" />} color="purple" href="/dashboard/documents" index={0} />
          <StatCard title="Images Indexed" value={totalImages} icon={<ImageIcon className="w-6 h-6" />} color="blue" index={1} />
          <StatCard title="Words Indexed" value={formatNumber(totalWords)} icon={<DocumentIcon className="w-6 h-6" />} color="purple" index={2} />
          <StatCard title="Context Exports" value="Coming Soon" icon={<CopyIcon className="w-6 h-6" />} color="orange" index={3} />
        </div>
      </AnimatedSection>

      {!hasDocuments ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] bg-zinc-900/40 px-6 py-16 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-950 shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
            <FolderIcon className="h-8 w-8 text-purple-400" />
          </div>
          <p className="font-display text-2xl uppercase text-white">No documents yet</p>
          <p className="mt-1 text-sm text-zinc-400">Upload your first document to get started</p>
          <Link href="/dashboard/upload" className="btn-primary mt-6 px-6 py-3 text-sm">
            Upload document
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatedSection direction="left" delay={0.2}>
            <div className="brutal-card p-6">
              <h2 className="font-display text-lg uppercase text-white mb-5">Knowledge Insights</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-emerald-400 text-emerald-950">
                    <FileIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="kicker">Most Recent Upload</p>
                    <p className="text-white font-medium truncate mt-0.5">{mostRecentUpload?.title ?? "N/A"}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Uploaded {mostRecentUpload ? formatRelativeTime(mostRecentUpload.createdAt) : "—"}
                    </p>
                  </div>
                </div>
                <div className="h-0.5 bg-zinc-800" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-sky-400 text-sky-950">
                    <DocumentIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="kicker">Largest Document</p>
                    {largestDocument ? (
                      <>
                        <p className="text-white font-medium truncate mt-0.5">{largestDocument.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatNumber(largestDocument.charCount)} characters
                        </p>
                      </>
                    ) : (
                      <p className="text-zinc-500 text-sm mt-0.5">No documents with text content</p>
                    )}
                  </div>
                </div>
                <div className="h-0.5 bg-zinc-800" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-purple-500 text-white">
                    <PdfIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="kicker">Most Common File Type</p>
                    {commonFileTypeInfo ? (
                      <>
                        <p className="text-white font-medium mt-0.5">
                          {getFileTypeLabel(commonFileTypeInfo.fileType)}
                          <span className="text-zinc-400 font-normal">
                            {" "}({commonFileTypeInfo.count} file{commonFileTypeInfo.count !== 1 ? "s" : ""})
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-zinc-500 text-sm mt-0.5">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </AnimatedSection>

            <AnimatedSection direction="left" delay={0.3}>
            <div className="brutal-card p-6">
              <h2 className="font-display text-lg uppercase text-white mb-5">Top Knowledge Sources</h2>
              {topDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <DocumentIcon className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="text-zinc-500 text-sm">No documents with text content yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {topDocuments.map((doc, idx) => (
                    <div key={`${doc.fileName}-${idx}`} className="flex items-center gap-4 border-b-2 border-zinc-800 p-3 last:border-b-0 transition-colors hover:bg-zinc-800/40">
                      <span className="w-5 text-right font-mono text-[0.65rem] text-zinc-500">{String(idx + 1).padStart(2, "0")}</span>
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-950 text-zinc-400">
                        <FileTypeIcon fileType={doc.fileType} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{doc.title}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="border-2 border-[var(--color-border)] px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-zinc-400">
                          {getFileTypeLabel(doc.fileType)}
                        </span>
                        <span className="font-mono text-[0.65rem] text-zinc-500">
                          {formatNumber(doc.charCount)} chars
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </AnimatedSection>

            <AnimatedSection direction="left" delay={0.4}>
            <div className="brutal-card p-6">
              <h2 className="font-display text-lg uppercase text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Link href="/dashboard/upload" className="group flex flex-col items-center gap-3 border-2 border-[var(--color-border)] bg-zinc-950 p-4 shadow-[3px_3px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-primary-vivid)]">
                  <UploadIcon className="w-6 h-6 text-purple-400" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-300">Upload</span>
                </Link>
                <Link href="/dashboard/documents" className="group flex flex-col items-center gap-3 border-2 border-[var(--color-border)] bg-zinc-950 p-4 shadow-[3px_3px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-primary-vivid)]">
                  <FolderIcon className="w-6 h-6 text-sky-400" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-300">Browse</span>
                </Link>
                <Link href="/dashboard/search" className="group flex flex-col items-center gap-3 border-2 border-[var(--color-border)] bg-zinc-950 p-4 shadow-[3px_3px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-primary-vivid)]">
                  <DocumentIcon className="w-6 h-6 text-purple-400" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-300">Search</span>
                </Link>
                <Link href="/dashboard/settings" className="group flex flex-col items-center gap-3 border-2 border-[var(--color-border)] bg-zinc-950 p-4 shadow-[3px_3px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-primary-vivid)]">
                  <SettingsIcon className="w-6 h-6 text-zinc-400" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-300">Settings</span>
                </Link>
              </div>
            </div>
            </AnimatedSection>
          </div>

          <AnimatedSection direction="right" delay={0.2}>
          <div className="space-y-6">
            <div className="brutal-card p-6">
              <h2 className="font-display text-lg uppercase text-white mb-5">Storage Breakdown</h2>
              <div className="space-y-3">
                <Link href="/dashboard/documents?type=pdf" className="flex items-center justify-between border-2 border-[var(--color-border)] bg-zinc-950 p-3 shadow-[2px_2px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border)] bg-red-500 text-white">
                      <PdfIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-300">PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-white">{storageBreakdown["PDF"] ?? 0}</span>
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </Link>
                <Link href="/dashboard/documents?type=docx" className="flex items-center justify-between border-2 border-[var(--color-border)] bg-zinc-950 p-3 shadow-[2px_2px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border)] bg-sky-400 text-sky-950">
                      <DocumentIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-300">DOCX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-white">{storageBreakdown["DOCX"] ?? 0}</span>
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </Link>
                <Link href="/dashboard/documents?type=text" className="flex items-center justify-between border-2 border-[var(--color-border)] bg-zinc-950 p-3 shadow-[2px_2px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-700 text-white">
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-300">TXT/MD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-white">{storageBreakdown["TXT/MD"] ?? 0}</span>
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </Link>
                <Link href="/dashboard/documents?type=image" className="flex items-center justify-between border-2 border-[var(--color-border)] bg-zinc-950 p-3 shadow-[2px_2px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border)] bg-purple-500 text-white">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-300">Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-white">{storageBreakdown["Images"] ?? 0}</span>
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          </AnimatedSection>
        </div>
      )}
    </div>
  );
}