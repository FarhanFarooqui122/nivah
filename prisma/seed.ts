import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma";
import { chunkText } from "../lib/chunker";
import { createNotification } from "../lib/notifications";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function generateSeedEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });
    return result.embeddings?.[0]?.values ?? null;
  } catch (error) {
    console.error("[Seed Embedding] Failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

const SEED_WORKSPACE = "Study Pack";

interface SeedDocument {
  title: string;
  fileName: string;
  summary: string;
  text: string;
}

const DOCUMENTS: SeedDocument[] = [
  {
    title: "Photosynthesis: The Light Reactions",
    fileName: "photosynthesis.txt",
    summary:
      "Covers how plants convert light energy into chemical energy — photosystems II and I, the electron transport chain, and the production of ATP and NADPH.",
    text: `Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. It occurs primarily in the chloroplast, a double-membrane organelle found in plant cells. The overall reaction is 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. Carbon dioxide enters the leaf through stomata, while water is absorbed by the roots and transported to the leaves through the xylem.

Photosynthesis has two main stages: the light-dependent reactions and the Calvin cycle. The light-dependent reactions occur in the thylakoid membranes of the chloroplast and require direct sunlight. They convert light energy into two energy-carrying molecules: ATP and NADPH. The Calvin cycle, also called the light-independent reactions, takes place in the stroma and uses ATP and NADPH to fix carbon dioxide into glucose.

The light reactions begin when chlorophyll pigments in photosystem II absorb photons of light. This energy excites electrons in the chlorophyll molecules, which are then passed to the primary electron acceptor. Water is split to replace these lost electrons, releasing oxygen gas as a byproduct — this is the source of the oxygen we breathe. The energized electrons travel along the electron transport chain embedded in the thylakoid membrane.

As electrons move down the electron transport chain, they release energy that is used to pump hydrogen ions (protons) from the stroma into the thylakoid lumen. This builds up a proton gradient across the membrane. The protons flow back out through ATP synthase, a molecular turbine, driving the synthesis of ATP from ADP and inorganic phosphate. This process is called photophosphorylation, and it is analogous to the way a water wheel generates power.

The electrons, now at a lower energy level, are re-energized by photosystem I, which absorbs light at a slightly different wavelength. Photosystem I passes these electrons to ferredoxin, and ultimately to NADP+ reductase, which reduces NADP+ to NADPH. NADPH carries the high-energy electrons that will later be used in the Calvin cycle to reduce carbon dioxide into carbohydrates.

In summary, the light reactions produce three key outputs: ATP, NADPH, and oxygen. ATP provides the energy for the Calvin cycle, NADPH provides the reducing power, and oxygen diffuses out of the leaf. The next stage of photosynthesis, the Calvin cycle, then uses these molecules to build glucose, completing the journey of solar energy into chemical energy.`,
  },
  {
    title: "Database Normalization: 1NF to 3NF",
    fileName: "normalization.txt",
    summary:
      "A practical introduction to relational database design — what normalization is, and how to take a messy table to First, Second, and Third Normal Form.",
    text: `Database normalization is the process of organizing a relational database to reduce data redundancy and improve data integrity. It was first proposed by Edgar F. Codd in 1970 as part of his relational model. A normalized database avoids duplicate data, prevents update anomalies, and makes queries more predictable. Normalization is applied in a series of normal forms, each building on the previous one.

First Normal Form (1NF) requires that every column in a table stores only atomic, indivisible values, and that each row is unique. For example, a table storing multiple phone numbers in a single cell like "555-0101, 555-0199" violates 1NF. The fix is to split the values into separate rows, or move them to a child table. Every table must also have a primary key that uniquely identifies each row. A table is in 1NF if all values are atomic and every row is uniquely identifiable.

Second Normal Form (2NF) applies to tables with composite primary keys. A table is in 2NF if it is in 1NF and every non-key column depends on the entire composite key, not just part of it. Consider a table of enrollments with the composite key (StudentID, CourseID). If the column "StudentName" depends only on StudentID, it is partially dependent on the key, violating 2NF. The fix is to split the table: move StudentName into a Students table keyed by StudentID, and keep only course-specific data in the enrollment table.

Third Normal Form (3NF) requires that the table is in 2NF and has no transitive dependencies. A transitive dependency occurs when a non-key column depends on another non-key column rather than on the primary key directly. For example, in an orders table with OrderID as the key, storing CustomerName and CustomerCity together creates a transitive dependency if CustomerCity depends on CustomerName. The fix is to extract the customer details into a separate Customers table keyed by CustomerID.

Beyond 3NF lie Boyce-Codd Normal Form (BCNF) and higher forms like 4NF and 5NF, which handle more advanced edge cases such as overlapping candidate keys and multi-valued dependencies. For most real-world applications, achieving 3NF is sufficient. In practice, designers sometimes denormalize deliberately — reintroducing some redundancy in exchange for query performance — for example in data warehouses and read-heavy analytics systems, where joins across many normalized tables would be too slow.`,
  },
  {
    title: "The French Revolution: 1789-1799",
    fileName: "french-revolution.txt",
    summary:
      "A timeline of the French Revolution — from the Estates-General and the storming of the Bastille, through the Reign of Terror, to Napoleon's rise.",
    text: `The French Revolution (1789-1799) was a period of radical social and political upheaval in France that overthrew the monarchy, established a republic, and transformed European politics forever. It was driven by deep inequality: the clergy and nobility made up about 2% of the population but owned most of the land and paid almost no taxes, while the Third Estate — everyone else — carried the tax burden despite famine and rising bread prices.

The revolution began in May 1789 when King Louis XVI, facing a financial crisis, summoned the Estates-General for the first time since 1614. The Third Estate, frustrated with the traditional voting structure, declared itself the National Assembly and, in the Tennis Court Oath, vowed not to disband until a constitution was written. On July 14, 1789, Parisians stormed the Bastille, a fortress-prison that symbolized royal authority. This date is celebrated today as Bastille Day.

In August 1789 the Assembly issued the Declaration of the Rights of Man and of the Citizen, which proclaimed that all men are born free and equal in rights. The revolution entered a more radical phase in 1792 with the declaration of the First French Republic and the execution of Louis XVI in January 1793. Fear of counter-revolution and foreign invasion fueled the Reign of Terror (1793-1794), led by the Committee of Public Safety under Maximilien Robespierre, during which tens of thousands were guillotined.

The Terror ended with Robespierre's own execution in July 1794, a period known as the Thermidorian Reaction. Power then passed to the Directory, a five-member executive body, which proved weak and corrupt. In November 1799, a young general named Napoleon Bonaparte staged a coup d'etat and overthrew the Directory, ending the revolution and beginning his fifteen-year rise to rule France and much of Europe.

The French Revolution's legacy is enormous. It spread the ideals of liberty, equality, and fraternity, abolished feudalism in France, introduced the metric system, and inspired revolutionary movements across Europe and the world — including the Haitian Revolution and later the Latin American independence wars. Its ideas continue to shape modern democratic thought.`,
  },
  {
    title: "Machine Learning Fundamentals",
    fileName: "machine-learning.txt",
    summary:
      "An overview of machine learning — supervised vs. unsupervised learning, training and test sets, overfitting, and the bias-variance tradeoff.",
    text: `Machine learning is a branch of artificial intelligence that gives computers the ability to learn from data without being explicitly programmed for every rule. Instead of hard-coding answers, a machine learning system finds patterns in examples and generalizes from them to make predictions on new, unseen data. It powers everything from email spam filters to medical image diagnosis and recommendation engines.

The two broad categories are supervised and unsupervised learning. In supervised learning, the training data comes with labels — for example, images labeled as "cat" or "dog" — and the model learns a mapping from inputs to outputs. Common supervised tasks are classification, where the output is a category, and regression, where the output is a continuous number like a house price. In unsupervised learning, the data has no labels, and the algorithm must find structure on its own, such as grouping customers into clusters or reducing the dimensions of high-dimensional data.

A key principle is that a model must be evaluated on data it has never seen before. The available data is typically split into a training set and a test set. The model learns its parameters from the training set, and its true performance is measured on the test set. If a model performs well on training data but poorly on test data, it is overfitting — it has memorized the training examples instead of learning the underlying pattern. Underfitting is the opposite: the model is too simple to capture the pattern at all.

This tension is captured by the bias-variance tradeoff. Bias is the error introduced by oversimplifying the problem, while variance is the error introduced by being too sensitive to the training data. Simple models have high bias and low variance; complex models have low bias but high variance. The goal is to find the sweet spot in the middle that minimizes total error on unseen data. Regularization techniques, like L1 and L2 penalty terms, can help by gently constraining overly complex models.

Training a model generally follows the same loop: choose a model architecture, define a loss function that measures prediction error, then iteratively update the model's parameters to minimize that loss — usually with gradient descent. Gradients are computed efficiently using backpropagation. Advances in hardware, large datasets, and deep neural networks with millions of parameters have made modern machine learning remarkably powerful, but the fundamentals — generalization, evaluation, and the bias-variance tradeoff — remain as important as ever.`,
  },
];

const SEED_CHAT: { role: "USER" | "ASSISTANT"; content: string }[] = [
  {
    role: "USER",
    content: "What is the difference between supervised and unsupervised learning?",
  },
  {
    role: "ASSISTANT",
    content:
      "In supervised learning the training data includes labels, so the model learns a mapping from inputs to outputs (e.g. classification or regression). In unsupervised learning the data has no labels and the algorithm finds structure on its own, such as clustering customers into groups.",
  },
];

async function seed() {
  const args = process.argv.slice(2);
  const clerkIdArg = args.find((arg) => arg.startsWith("--clerkId="))?.split("=")[1];

  let clerkId = clerkIdArg;
  if (!clerkId) {
    const latest = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
    clerkId = latest?.clerkId;
  }
  if (!clerkId) {
    console.error(
      "No Clerk account found in the database. Sign in to the app once, then re-run.\n" +
        "You can also target an account explicitly: npm run seed -- --clerkId=user_xxx"
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    console.error(`No user with clerkId ${clerkId} found in the database.`);
    process.exit(1);
  }

  const existing = await prisma.document.findFirst({ where: { userId: user.id } });
  if (existing) {
    console.log(`User ${user.email} already has documents. Run with --reset to wipe and reseed.`);
    return;
  }
  console.log(`Seeding into account: ${user.email} (${clerkId})`);

  const workspace = await prisma.workspace.create({
    data: {
      name: SEED_WORKSPACE,
      description: "Demo documents for the Nivah presentation",
      userId: user.id,
    },
  });
  console.log(`Created workspace: ${workspace.name}`);

  let totalChunks = 0;

  for (const doc of DOCUMENTS) {
    const document = await prisma.document.create({
      data: {
        title: doc.title,
        fileName: doc.fileName,
        fileType: "text/plain",
        fileSize: Buffer.byteLength(doc.text),
        fileUrl: "",
        textContent: doc.text,
        summary: doc.summary,
        userId: user.id,
        workspaceId: workspace.id,
      },
    });

    await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl: `/api/documents/${document.id}/file` },
    });

    const chunks = chunkText(doc.text);
    const embeddings = await Promise.all(chunks.map((chunk) => generateSeedEmbedding(chunk.content)));

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const id = `seed_chunk_${document.id}_${chunk.chunkIndex}`;
      if (embedding) {
        await prisma.$executeRaw`
          INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "embedding", "embeddingVector", "createdAt")
          VALUES (${id}, ${document.id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, ${JSON.stringify(embedding)}::jsonb, ${toVectorLiteral(embedding)}::vector, NOW())
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "createdAt")
          VALUES (${id}, ${document.id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, NOW())
        `;
      }
    }

    const embeddedCount = embeddings.filter(Boolean).length;
    totalChunks += chunks.length;
    console.log(
      `Seeded "${doc.title}" — ${chunks.length} chunks (${embeddedCount} embedded)`
    );

    await createNotification(
      user.id,
      "upload_complete",
      `"${doc.title}" uploaded`,
      `Successfully uploaded and indexed ${chunks.length} chunks`,
      `/dashboard/documents/${document.id}`
    );
  }

  const session = await prisma.chatSession.create({
    data: {
      title: "Machine Learning Q&A",
      userId: user.id,
      workspaceId: workspace.id,
    },
  });

  for (const message of SEED_CHAT) {
    await prisma.chatMessage.create({
      data: {
        role: message.role,
        content: message.content,
        sessionId: session.id,
      },
    });
  }
  console.log(`Created chat session: ${session.title}`);

  console.log(`\nDone! Seeded 1 workspace, ${DOCUMENTS.length} documents, ${totalChunks} chunks, 1 chat session into ${user.email}.`);
}

async function reset() {
  const args = process.argv.slice(2);
  const clerkIdArg = args.find((arg) => arg.startsWith("--clerkId="))?.split("=")[1];
  const clerkId =
    clerkIdArg ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "desc" } }))?.clerkId;
  if (!clerkId) {
    console.log("No users found to reset.");
    return;
  }
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    console.log("No user matches that clerkId.");
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { documents: { deleteMany: {} }, chatSessions: { deleteMany: {} }, notifications: { deleteMany: {} } },
  });
  console.log(`Deleted documents/chats/notifications for ${user.email} (user account kept).`);
}

const args = process.argv.slice(2);
if (args.includes("--reset")) {
  reset()
    .catch((error) => {
      console.error("Reset failed:", error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
} else {
  seed()
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
