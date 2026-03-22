"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPost, updatePost, deletePost, formatDate, type Post } from "../../lib/posts";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "1";

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(isEdit);

  useEffect(() => {
    const p = getPost(params.id as string);
    if (!p) {
      router.push("/writing");
      return;
    }
    setPost(p);
    setTitle(p.title);
    setContent(p.content);
  }, [params.id, router]);

  function handleSave() {
    if (!post) return;
    const updated = updatePost(post.id, { title, content });
    if (updated) {
      setPost(updated);
      setEditing(false);
    }
  }

  function handleDelete() {
    if (!post) return;
    if (!confirm("确定要删除这篇文章吗？")) return;
    deletePost(post.id);
    router.push("/writing");
  }

  if (!post) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/writing"
          className="text-sm flex items-center gap-1"
          style={{ color: "var(--muted)" }}
        >
          ← 返回列表
        </Link>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                保存
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: "#e8f0fe",
                  color: "#3498db",
                }}
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: "#fee8e8",
                  color: "var(--accent)",
                }}
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>

      <article
        className="rounded-2xl p-8"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {editing ? (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold outline-none mb-4 pb-4"
              style={{
                borderBottom: "1px solid var(--border)",
                backgroundColor: "transparent",
              }}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full outline-none resize-none text-base leading-relaxed"
              style={{
                minHeight: "60vh",
                backgroundColor: "transparent",
              }}
            />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
              {formatDate(post.createdAt)}
              {post.updatedAt !== post.createdAt &&
                ` · 更新于 ${formatDate(post.updatedAt)}`}
            </p>
            <div className="prose whitespace-pre-wrap">{post.content}</div>
          </>
        )}
      </article>
    </div>
  );
}
