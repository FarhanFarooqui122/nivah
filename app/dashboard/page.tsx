import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();

  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  if (!email) {
    return <div>No email found</div>;
  }

  let user = await prisma.user.findUnique({
  where: {
    clerkId: userId,
  },
});

console.log("Found user:", user);

if (!user) {
  console.log("Creating user:", userId, email);

  user = await prisma.user.create({
    data: {
      clerkId: userId,
      email,
    },
  });

  console.log("Created user:", user);
}

 return (
  <div className="min-h-screen bg-black text-white p-10">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">
        Welcome to Nivah 🚀
      </h1>

      <p className="text-zinc-400 mb-8">
        {email}
      </p>

      <div className="flex gap-4 mb-8">
        <a
          href="/upload"
          className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg font-medium"
        >
          Upload Document
        </a>
      </div>

      <div className="border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          My Documents
        </h2>

        <p className="text-zinc-500">
          No documents uploaded yet.
        </p>
      </div>
    </div>
  </div>
);
}