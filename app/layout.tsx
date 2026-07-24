import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <head>
          <script dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("nivah-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
          }} />
        </head>
        <body>
          <div id="grain" />
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
