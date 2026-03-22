import { WriteEditor } from "./WriteEditor";
import { prisma } from "@/lib/prisma";

export default async function WritePage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-pink-50 via-zinc-50 to-violet-50 px-6 py-6 font-sans text-foreground dark:from-fuchsia-950/20 dark:via-black dark:to-violet-950/20">
      <main className="mx-auto flex w-[90vw] max-w-none flex-1 min-h-0 items-stretch">
        <WriteEditor availableTags={tags.map((t) => t.name)} />
      </main>
    </div>
  );
}
