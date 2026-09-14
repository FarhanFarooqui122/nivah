import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { SidebarProvider } from "@/lib/sidebar-context";
import { PageTransition } from "@/components/PageTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-zinc-950 text-white flex">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-on-brand focus:rounded-lg"
        >
          Skip to content
        </a>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main id="main-content" className="flex-1 p-6 md:p-8 flex flex-col min-h-0 overflow-auto">
            <div className="max-w-7xl mx-auto w-full flex-1 min-h-0">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
