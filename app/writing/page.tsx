"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosts, deletePost, formatDate, type Post } from "../lib/posts";

export default function WritingPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  function handleDelete(id: string) {
    if (!confirm("确定要删除这篇文章吗？")) return;
    deletePost(id);
    setPosts(getPosts());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">✍️ 写作</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            记录思想，留住时光
          </p>
        </div>
        <Link
          href="/writing/new"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          + 新建文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-5xl mb-4">📝</div>
          <p style={{ color: "var(--muted)" }}>还没有文章，写下第一篇吧</p>
          <Link
            href="/writing/new"
            className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            开始写作
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl p-6 transition-shadow hover:shadow-md"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <Link href={`/writing/${post.id}`} className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold hover:underline truncate">
                    {post.title || "无标题"}
                  </h2>
                  <p
                    className="mt-2 text-sm line-clamp-2"
                    style={{ color: "var(--muted)" }}
                  >
                    {post.content.slice(0, 120)}
                  </p>
                  <p
                    className="mt-3 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {formatDate(post.createdAt)}
                  </p>
                </Link>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/writing/${post.id}?edit=1`}
                    className="px-3 py-1 rounded text-xs"
                    style={{
                      backgroundColor: "#e8f0fe",
                      color: "#3498db",
                    }}
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1 rounded text-xs"
                    style={{
                      backgroundColor: "#fee8e8",
                      color: "var(--accent)",
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
