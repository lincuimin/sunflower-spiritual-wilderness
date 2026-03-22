"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePost } from "../../lib/posts";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    const post = savePost({ title: title.trim() || "无标题", content });
    router.push(`/writing/${post.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">新建文章</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <input
          type="text"
          placeholder="文章标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold outline-none mb-4 pb-4"
          style={{
            borderBottom: "1px solid var(--border)",
            backgroundColor: "transparent",
          }}
        />
        <textarea
          placeholder="在这里写下你的想法..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full outline-none resize-none text-base leading-relaxed"
          style={{
            minHeight: "60vh",
            backgroundColor: "transparent",
          }}
        />
      </div>
    </div>
  );
}
