import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nivah",
  description: "AI-powered cloud storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("nivah-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
          }} />
        </head>
        <body>
          <ThemeWrapper>
            <main className="animate-fade-in">
              {children}
            </main>
          </ThemeWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
