"use client";

import { useEffect, useMemo, useState } from "react";

type Activity = {
  title?: string;
  summary?: string;
  category?: "MOMENT" | "BOOK_MOVIE" | "TRAVEL";
  keywords?: string[];
};

export function AiActivityPanel({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activity, setActivity] = useState<Activity>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmed = useMemo(() => text.trim(), [text]);

  useEffect(() => {
    if (trimmed.length < 20) {
      setStatus("idle");
      setActivity({});
      setErrorMessage(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    const controller = new AbortController();

    const id = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/activity", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
          signal: controller.signal,
        });

        if (res.redirected && res.url.includes("/login")) {
          setErrorMessage("未登录或登录已过期");
          setStatus("error");
          return;
        }

        if (!res.ok) {
          let details = "请求失败";
          try {
            const maybeJson = (await res.json()) as { error?: unknown };
            if (typeof maybeJson?.error === "string" && maybeJson.error.trim()) {
              details = maybeJson.error.trim();
            }
          } catch {
            // ignore
          }

          if (res.status === 401) details = "未登录或登录已过期";
          if (res.status === 429) details = "请求太频繁了，稍等 1~2 秒再试";
          if (details === "请求失败") details = `请求失败（${res.status}）`;

          setErrorMessage(details);
          setStatus("error");
          return;
        }

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          const raw = await res.text();
          if (raw.trim().startsWith("<!DOCTYPE") || raw.includes("<html")) {
            setErrorMessage("未登录或登录已过期");
          } else {
            setErrorMessage("接口返回格式错误（非 JSON）");
          }
          setStatus("error");
          return;
        }

        const json = (await res.json()) as Activity;

        setActivity(json);
        setStatus("idle");
      } catch (e) {
        if (controller.signal.aborted) return;

        const message = e instanceof Error ? e.message : "网络错误或服务不可用";
        if (typeof message === "string" && /aborted|abort/i.test(message)) return;

        if (typeof message === "string" && /failed to fetch/i.test(message)) {
          setErrorMessage("连接失败：请确认 dev 服务已启动，且没有代理/扩展拦截请求");
          setStatus("error");
          return;
        }

        setErrorMessage(message || "网络错误或服务不可用");
        setStatus("error");
      }
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [trimmed]);

  return (
    <aside className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-black">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">AI 实时活动</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {status === "loading"
            ? "分析中..."
            : status === "error"
              ? errorMessage ?? "请求失败"
              : trimmed.length < 20
                ? "请输入更多内容"
                : "已更新"}
        </span>
      </div>

      <div className="mt-3 space-y-3 text-sm">
        {activity.title ? (
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              标题建议
            </div>
            <div className="mt-1 text-foreground">{activity.title}</div>
          </div>
        ) : null}

        {activity.summary ? (
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              摘要
            </div>
            <div className="mt-1 whitespace-pre-wrap text-foreground">
              {activity.summary}
            </div>
          </div>
        ) : null}

        {activity.category ? (
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              分类建议
            </div>
            <div className="mt-1 font-mono text-foreground">{activity.category}</div>
          </div>
        ) : null}

        {activity.keywords && activity.keywords.length > 0 ? (
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              关键词
            </div>
            <div className="mt-1 text-foreground">
              {activity.keywords.join(" / ")}
            </div>
          </div>
        ) : null}

        {!activity.title && !activity.summary && !activity.category ? (
          <div className="text-zinc-600 dark:text-zinc-400">
            输入文字后，这里会实时给出摘要、标题与分类建议。
          </div>
        ) : null}
      </div>
    </aside>
  );
}
