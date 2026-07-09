import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SearchClient } from "@/components/SearchClient";

export default async function SearchPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <SearchClient />;
}