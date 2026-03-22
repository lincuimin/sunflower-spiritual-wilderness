"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FriendStatus = "idle" | "streaming" | "error";

type FriendMode = "auto" | "manual";

type FriendChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  meta?: { mode?: FriendMode };
};

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowMs() {
  return Date.now();
}

function shouldAutoBubble() {
  return Math.random() < 0.32;
}

function parseSseChunk(chunk: string) {
  const blocks = chunk.split("\n\n");
  const complete = blocks.slice(0, -1);
  const rest = blocks[blocks.length - 1] ?? "";

  const events: Array<{ event: string; data: string }> = [];
  for (const block of complete) {
    const lines = block.split("\n").filter(Boolean);
    let event = "message";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice("event:".length).trim() || "message";
      }
      if (line.startsWith("data:")) {
        data += line.slice("data:".length) + "\n";
      }
    }
    data = data.replace(/\n$/, "");
    if (data.length > 0) events.push({ event, data });
  }

  return { events, rest };
}

async function streamFriendReply(
  text: string,
  mode: FriendMode,
  signal: AbortSignal,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (chunk: string) => void,
) {
  const res = await fetch("/api/ai/friend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, mode, messages }),
    signal,
  });

  if (res.redirected && res.url.includes("/login")) {
    throw new Error("未登录或登录已过期");
  }

  if (!res.ok) {
    let details = `请求失败（${res.status}）`;
    try {
      const maybe = (await res.json()) as { error?: unknown };
      if (typeof maybe?.error === "string" && maybe.error.trim()) details = maybe.error.trim();
    } catch {
      // ignore
    }

    if (res.status === 401) details = "未登录或登录已过期";
    if (res.status === 429) details = "请求太频繁了，稍等一下再试";

    throw new Error(details);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/event-stream")) {
    throw new Error(
      `接口返回非流式（SSE）。content-type=${contentType || "(empty)"}`,
    );
  }

  if (!res.body) {
    throw new Error(
      `接口没有返回数据流（ReadableStream）。redirected=${String(res.redirected)}`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;

    for (const ev of parsed.events) {
      if (ev.event === "chunk") {
        onChunk(ev.data);
      }
      if (ev.event === "error") {
        try {
          const payload = JSON.parse(ev.data) as { message?: unknown };
          const msg = typeof payload?.message === "string" ? payload.message : "AI failed";
          throw new Error(msg);
        } catch (e) {
          throw e instanceof Error ? e : new Error("AI failed");
        }
      }
      if (ev.event === "done") {
        return;
      }
    }
  }
}

export function AiFriendPanel({ text }: { text: string }) {
  const [status, setStatus] = useState<FriendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chat, setChat] = useState<FriendChatMessage[]>([]);
  const [draft, setDraft] = useState<string>("");
  const shareRecordAsContext = true;

  const recordTrimmed = useMemo(() => text.trim(), [text]);

  const inFlight = useRef<AbortController | null>(null);
  const lastAutoAt = useRef<number>(0);
  const lastManualAt = useRef<number>(0);

  const chatRef = useRef<FriendChatMessage[]>([]);
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  const contextText = shareRecordAsContext ? recordTrimmed : "";

  const start = async (mode: FriendMode, userMessage?: string) => {

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    const now = nowMs();

    const userContent = typeof userMessage === "string" ? userMessage.trim() : "";

    const history = chatRef.current
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))
      .filter((m) => m.content.trim().length > 0)
      .slice(-12);

    const messages = userContent ? [...history, { role: "user" as const, content: userContent }] : history;

    if (userContent) {
      setChat((prev) => [
        ...prev,
        { id: randomId(), role: "user", content: userContent, at: now },
      ]);
    }

    const assistantId = randomId();
    setChat((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        at: now,
        meta: { mode },
      },
    ]);

    setStatus("streaming");
    setErrorMessage(null);

    try {
      await streamFriendReply(
        contextText,
        mode,
        controller.signal,
        messages,
        (chunk) => {
          setChat((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + chunk }
                : m,
            ),
          );
        },
      );

      setStatus("idle");
      setChat((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content.trim() } : m,
        ),
      );
    } catch (e) {
      if (controller.signal.aborted) return;

      const msg = e instanceof Error ? e.message : "网络错误或服务不可用";
      if (typeof msg === "string" && /aborted|abort/i.test(msg)) return;

      const shown =
        typeof msg === "string" && /failed to fetch/i.test(msg)
          ? "连接失败：请确认 dev 服务已启动，且没有代理/扩展拦截请求"
          : msg || "网络错误或服务不可用";
      setErrorMessage(shown);
      setStatus("error");

      setChat((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((m) => m.role === "assistant" && !m.content.trim());
        if (idx >= 0) next.splice(idx, 1);
        return next;
      });
    }
  };

  useEffect(() => {
    const idleDelayMs = 2200;
    const autoCooldownMs = 60_000;
    const autoMinChars = 20;

    const timer = window.setTimeout(() => {
      if (status === "streaming") return;

      if (!shareRecordAsContext) return;
      if (recordTrimmed.length < autoMinChars) return;

      const lastAuto = lastAutoAt.current;
      const lastManual = lastManualAt.current;
      const now = nowMs();

      if (now - lastAuto < autoCooldownMs) return;
      if (now - lastManual < 8000) return;
      if (!shouldAutoBubble()) return;

      lastAutoAt.current = now;
      void start("auto");
    }, idleDelayMs);

    return () => window.clearTimeout(timer);
  }, [recordTrimmed, shareRecordAsContext, status]);

  return (
    <aside className="flex h-full w-full min-h-0 flex-col rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-black">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">永恒发光的小太阳</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              lastManualAt.current = nowMs();
              void start("manual");
            }}
            disabled={status === "streaming"}
            className="h-8 rounded-lg border border-black/[.08] bg-transparent px-3 text-xs font-medium text-foreground outline-none disabled:opacity-60 dark:border-white/[.145]"
          >
            叫一下
          </button>
          {status === "streaming" ? (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              正在冒泡...
            </span>
          ) : status === "error" ? (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {errorMessage ?? "请求失败"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-auto rounded-lg border border-black/[.08] bg-zinc-50 p-3 text-sm dark:border-white/[.145] dark:bg-black">
          {chat.length === 0 ? (
            <div className="text-zinc-600 dark:text-zinc-400">
              你继续写，我会在你停顿时偶尔冒一句；也可以点“叫一下”。
              你也可以直接在下面回复我，我们就这样聊。
            </div>
          ) : (
            chat.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-lg bg-foreground px-3 py-2 text-background"
                      : "max-w-[85%] whitespace-pre-wrap rounded-lg border border-black/[.08] bg-white px-3 py-2 text-foreground dark:border-white/[.145] dark:bg-black"
                  }
                >
                  {m.content || (m.role === "assistant" ? "..." : "")}
                </div>
              </div>
            ))
          )}
        </div>

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (status === "streaming") return;
            const content = draft.trim();
            if (!content) return;
            lastManualAt.current = nowMs();
            setDraft("");
            void start("manual", content);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="回复一句..."
            disabled={status === "streaming"}
            className="h-10 flex-1 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/[.145] dark:focus:border-white/40"
          />
          <button
            type="submit"
            disabled={status === "streaming" || !draft.trim()}
            className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          >
            发送
          </button>
        </form>
      </div>
    </aside>
  );
}
