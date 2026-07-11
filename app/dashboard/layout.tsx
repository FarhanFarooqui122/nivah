import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { SidebarProvider } from "@/lib/sidebar-context";

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
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:max-w-[calc(100vw-16rem)]">
          <Header />
          <main className="flex-1 p-6 md:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}