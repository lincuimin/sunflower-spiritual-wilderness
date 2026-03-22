"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDeleteForm } from "../write/ConfirmDeleteForm";
import type { UpdatePostState } from "../write/actions";

type Category = "MOMENT" | "BOOK_MOVIE" | "TRAVEL";

const initialState: UpdatePostState = { ok: true, justSaved: false };

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditablePostCard({
  post,
  formattedDate,
  updateAction,
  deleteAction,
}: {
  post: {
    id: number;
    title: string | null;
    content: string;
    imageUrl: string | null;
    category: Category;
    eventDateISO: string;
    tags?: string[];
  };
  formattedDate: string;
  updateAction: (prevState: UpdatePostState, formData: FormData) => Promise<UpdatePostState>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(post.title ?? "");
  const [content, setContent] = useState(post.content);
  const [eventDate, setEventDate] = useState(isoToDatetimeLocal(post.eventDateISO));

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [tagsRaw, setTagsRaw] = useState((post.tags ?? []).join(" / "));
  const tags = useMemo(
    () =>
      tagsRaw
        .split(/[\/、,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [tagsRaw],
  );

  const [state, action, pending] = useActionState(updateAction, initialState);

  const COLLAPSED_MAX_HEIGHT_PX = 84;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentMaxHeight, setContentMaxHeight] = useState<number>(COLLAPSED_MAX_HEIGHT_PX);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const rippleTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number }>>([]);

  const onCardClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (editing) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("button,a,input,textarea,select,option,label,form")) return;

      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setRipples((prev) => [...prev, { id, x, y }].slice(-6));
      const t = setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
        rippleTimerRef.current.delete(id);
      }, 520);
      rippleTimerRef.current.set(id, t);

      toggleExpanded();
    },
    [editing, toggleExpanded],
  );

  const onCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (editing) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      toggleExpanded();
    },
    [editing, toggleExpanded],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (typeof window === "undefined") return;

      const originalTitle = post.title ?? "";
      const originalContent = post.content;
      const originalEventDate = isoToDatetimeLocal(post.eventDateISO);
      const originalTagsRaw = (post.tags ?? []).join(" / ");

      const noChanges =
        title.trim() === originalTitle.trim() &&
        content.trim() === originalContent.trim() &&
        eventDate === originalEventDate &&
        (post.category !== "MOMENT" || tagsRaw.trim() === originalTagsRaw.trim());

      const ok = window.confirm(
        noChanges ? "未检测到修改，仍要保存吗？" : "确定修改并保存吗？",
      );
      if (!ok) e.preventDefault();
    },
    [content, eventDate, post, tagsRaw, title],
  );

  useEffect(() => {
    if (state.ok === true && state.justSaved) {
      setEditing(false);
    }
  }, [state]);

  useEffect(() => {
    if (editing) return;
    const el = contentRef.current;
    if (!el) return;

    if (expanded) {
      // scrollHeight is stable even when max-height is constrained.
      setContentMaxHeight(el.scrollHeight);
    } else {
      setContentMaxHeight(COLLAPSED_MAX_HEIGHT_PX);
    }
  }, [editing, expanded, post.content]);

  useEffect(() => {
    if (pending) return;
    if (state.ok !== true) return;
    if (!state.justSaved) return;

    setSuccessMessage("修改成功");

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    successTimerRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimerRef.current = null;
    }, 1000);
  }, [pending, state]);

  useEffect(() => {
    return () => {
      for (const t of rippleTimerRef.current.values()) clearTimeout(t);
      rippleTimerRef.current.clear();
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editing) {
      setTitle(post.title ?? "");
      setContent(post.content);
      setEventDate(isoToDatetimeLocal(post.eventDateISO));
      setTagsRaw((post.tags ?? []).join(" / "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  return (
    <article
      className={
        "relative rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-black" +
        (!editing ? " cursor-pointer" : "")
      }
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      role={editing ? undefined : "button"}
      tabIndex={editing ? undefined : 0}
      aria-expanded={editing ? undefined : expanded}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/10 animate-ping"
          style={{ left: r.x, top: r.y }}
          aria-hidden="true"
        />
      ))}
      <div className="flex items-start justify-between gap-4">
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{formattedDate}</div>
        <div className="flex items-center gap-3">
          {!editing ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              编辑
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(false);
              }}
              disabled={pending}
              className="text-xs text-zinc-600 underline-offset-2 hover:underline disabled:opacity-60 dark:text-zinc-400"
            >
              取消
            </button>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmDeleteForm id={post.id} action={deleteAction} />
          </div>
        </div>
      </div>

      {successMessage && state.ok === true && !pending ? (
        <div
          className="mt-3 rounded-lg border border-black/[.08] bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-black dark:text-zinc-300"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      ) : null}

      {editing ? (
        <form action={action} onSubmit={onSubmit} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={post.id} />

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">保存日期</span>
            <input
              name="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">标题（可选）</span>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
            />
          </label>

          {post.category === "MOMENT" ? (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">标签（用空格/逗号/斜杠分隔）</span>
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              />
              {tags.map((t) => (
                <input key={t} type="hidden" name="tags" value={t} />
              ))}
            </label>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">内容</span>
            <textarea
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm leading-7 outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
              required
            />
          </label>

          {state.ok === false ? (
            <div className="rounded-lg border border-black/[.08] bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-black dark:text-zinc-300">
              {state.message}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? "保存中..." : "保存"}
            </button>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {post.imageUrl ? "图片暂不支持在此处修改" : ""}
            </div>
          </div>
        </form>
      ) : (
        <>
          {post.title ? (
            <div className="mt-2 text-base font-semibold leading-6">{post.title}</div>
          ) : null}

          {post.imageUrl && expanded ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="mt-3 w-full rounded-lg border border-black/[.08] object-cover dark:border-white/[.145]"
            />
          ) : null}

          <div className="relative mt-3">
            <div
              ref={contentRef}
              className="whitespace-pre-wrap text-sm leading-7 transition-[max-height] duration-300 ease-out"
              style={{ maxHeight: contentMaxHeight, overflow: "hidden" }}
            >
              {post.content}
            </div>

            {!expanded ? (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white dark:to-black"
                aria-hidden="true"
              />
            ) : null}
          </div>

          <div className="pointer-events-none mt-2 inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span
              className={
                "inline-block transition-transform duration-300 " +
                (expanded ? "-rotate-180" : "rotate-0")
              }
              aria-hidden="true"
            >
              ▾
            </span>
            {expanded ? "点击收起" : "点击展开"}
          </div>

          {post.category === "MOMENT" && post.tags && post.tags.length > 0 && expanded ? (
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              标签：{post.tags.join(" / ")}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
