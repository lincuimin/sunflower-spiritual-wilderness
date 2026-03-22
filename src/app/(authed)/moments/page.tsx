import { prisma } from "@/lib/prisma";
import { PostCategory } from "@/generated/prisma";
import { deletePostAction, updatePostAction } from "../write/actions";
import { TagFilter } from "./TagFilter";
import { EditablePostCard } from "../posts/EditablePostCard";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "瞬间逝去",
};

function formatDate(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedTagRaw = resolvedSearchParams.tag;
  const selectedTag =
    typeof selectedTagRaw === "string"
      ? selectedTagRaw
      : Array.isArray(selectedTagRaw)
        ? selectedTagRaw[0] ?? null
        : null;

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where: {
        category: PostCategory.MOMENT,
        ...(selectedTag
          ? { tags: { some: { tag: { name: selectedTag } } } }
          : {}),
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.tag.findMany({
      where: { posts: { some: { post: { category: PostCategory.MOMENT } } } },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-sky-50 via-zinc-50 to-pink-50 px-6 py-10 font-sans text-foreground dark:from-slate-950 dark:via-black dark:to-fuchsia-950/20">
      <main className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <MessageCircle className="h-6 w-6 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            瞬间逝去
          </h1>
          <TagFilter tags={tags.map((t) => t.name)} value={selectedTag} />
        </div>

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
                category: "MOMENT",
                eventDateISO: p.eventDate.toISOString(),
                tags: p.tags.map((t) => t.tag.name),
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
