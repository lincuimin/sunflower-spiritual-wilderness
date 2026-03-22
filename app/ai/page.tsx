"use client";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "给我推荐一首适合深夜的歌",
  "写作时如何克服拖延？",
  "用一句话描述秋天",
  "聊聊生活的意义",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const reply: Message = {
        role: "assistant",
        content: data.content ?? data.error ?? "出错了，请稍后再试。",
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络错误，请检查连接后重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 14rem)" }}>
      <div className="mb-4">
        <h1 className="text-3xl font-bold">🤖 AI 对话</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          与小葵聊聊写作、音乐和生活
        </p>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl p-4 mb-4 space-y-4"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="text-6xl mb-4">🌻</div>
            <h2 className="text-xl font-bold mb-1">你好，我是小葵</h2>
            <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
              一个爱好文学、哲学和音乐的 AI 朋友
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-2 rounded-xl text-sm text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{
                backgroundColor:
                  msg.role === "user" ? "var(--accent)" : "#f0f8e8",
              }}
            >
              {msg.role === "user" ? "你" : "🌻"}
            </div>
            <div
              className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor:
                  msg.role === "user" ? "var(--accent)" : "var(--bg)",
                color:
                  msg.role === "user" ? "#fff" : "var(--text)",
                borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                borderBottomLeftRadius: msg.role === "assistant" ? 4 : undefined,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ backgroundColor: "#f0f8e8" }}
            >
              🌻
            </div>
            <div
              className="px-4 py-3 rounded-2xl text-sm"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div
        className="rounded-2xl flex gap-3 items-end p-3"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="和小葵说说话... (Enter 发送，Shift+Enter 换行)"
          rows={1}
          className="flex-1 resize-none outline-none text-sm leading-relaxed"
          style={{
            backgroundColor: "transparent",
            maxHeight: "8rem",
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
        >
          发送
        </button>
      </div>

      {messages.length > 0 && (
        <button
          onClick={() => setMessages([])}
          className="mt-2 text-xs self-center"
          style={{ color: "var(--muted)" }}
        >
          清空对话
        </button>
      )}
    </div>
  );
}
