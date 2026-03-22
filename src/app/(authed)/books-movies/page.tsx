import { prisma } from "@/lib/prisma";
import { PostCategory } from "@/generated/prisma";
import { deletePostAction, updatePostAction } from "../write/actions";
import { EditablePostCard } from "../posts/EditablePostCard";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "书籍电影摘抄",
};

function formatDate(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function BooksMoviesPage() {
  const posts = await prisma.post.findMany({
    where: { category: PostCategory.BOOK_MOVIE },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-violet-50 via-zinc-50 to-sky-50 px-6 py-10 font-sans text-foreground dark:from-violet-950/20 dark:via-black dark:to-slate-950">
      <main className="mx-auto w-full max-w-6xl">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <BookOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          书籍电影摘抄
        </h1>

        <div className="mt-6 space-y-4">
          {posts.map((p) => (
            <EditablePostCard
              key={p.id}
              formattedDate={formatDate(p.eventDate)}
              updateAction={updatePostAction}
              deleteAction={deletePostAction}
              post={{
                id: p.id,
                title: p.title,
                content: p.content,
                imageUrl: p.imageUrl,
                category: "BOOK_MOVIE",
                eventDateISO: p.eventDate.toISOString(),
              }}
            />
          ))}

          {posts.length === 0 ? (
            <div className="rounded-xl border border-black/[.08] bg-white p-4 text-sm text-zinc-600 dark:border-white/[.145] dark:bg-black dark:text-zinc-400">
              暂无内容。
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
