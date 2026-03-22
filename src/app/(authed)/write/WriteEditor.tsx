"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { CreatePostState } from "./actions";
import { createPostAction } from "./actions";
import { AiFriendPanel } from "./AiFriendPanel";
import { Tag } from "lucide-react";

const initialState: CreatePostState = { ok: true, justSaved: false };

function defaultDateTimeLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WriteEditor({
  availableTags,
}: {
  availableTags: string[];
}) {
  const [state, action, pending] = useActionState(createPostAction, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [eventDate, setEventDate] = useState(() => defaultDateTimeLocal());
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [knownTags, setKnownTags] = useState<string[]>(availableTags);

  useEffect(() => {
    setKnownTags(availableTags);
  }, [availableTags]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of knownTags) {
      const trimmed = t.trim();
      if (trimmed) set.add(trimmed);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh"));
  }, [knownTags]);

  useEffect(() => {
    if (pending) {
      setShowSaveMenu(false);
      setShowTagPanel(false);
      setToastMessage("保存中…");
      return;
    }

    if (state.ok === false) {
      setToastMessage(state.message);

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      successTimerRef.current = setTimeout(() => {
        setToastMessage(null);
        successTimerRef.current = null;
      }, 2200);
      return;
    }

    if (pending) return;
    if (state.ok !== true) return;
    if (!state.justSaved) return;

    setTitle("");
    setText("");
    setEventDate(defaultDateTimeLocal());
    setTagInput("");
    setSelectedTags([]);
    formRef.current?.reset();
    setToastMessage("保存成功");
    setShowSaveMenu(false);
    setShowTagPanel(false);

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    successTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      successTimerRef.current = null;
    }, 1200);
  }, [pending, state]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  function clearSuccessIfAny() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (toastMessage) setToastMessage(null);
  }

  function normalizeTag(value: string) {
    return value.replace(/\s+/g, " ").trim();
  }

  function addTag(raw: string) {
    const name = normalizeTag(raw);
    if (!name) return;
    if (selectedTags.includes(name)) return;
    setSelectedTags((prev) => [...prev, name]);
    setKnownTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }

  function removeTag(name: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== name));
  }

  function toggleTag(name: string) {
    if (selectedTags.includes(name)) removeTag(name);
    else addTag(name);
  }

  function underlineButtonClass(active: boolean) {
    return (
      "inline-flex items-center gap-1 border-b pb-0.5 text-sm " +
      (active
        ? "border-foreground text-foreground"
        : "border-zinc-400 text-zinc-700 hover:text-foreground dark:border-zinc-500 dark:text-zinc-300")
    );
  }

  return (
    <div className="grid w-full flex-1 min-h-0 grid-cols-1 items-stretch gap-6 md:grid-cols-[65%_35%] md:grid-rows-[minmax(0,1fr)_auto]">
      {toastMessage ? (
        <div
          className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-lg border border-black/[.08] bg-zinc-50 px-4 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-black dark:text-zinc-300"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      ) : null}

      <form
        ref={formRef}
        action={action}
        className="flex flex-1 min-h-0 flex-col rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-black"
      >
          <input
            name="title"
            value={title}
            onChange={(e) => {
              clearSuccessIfAny();
              setTitle(e.target.value);
            }}
            placeholder="标题"
            className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-zinc-400"
          />

          <div className="mt-2 h-px w-full bg-black/[.06] dark:bg-white/[.10]" aria-hidden="true" />

          <textarea
            name="content"
            value={text}
            onChange={(e) => {
              clearSuccessIfAny();
              setText(e.target.value);
            }}
            placeholder="文字内容"
            className="mt-3 min-h-0 w-full flex-1 resize-none bg-transparent text-sm leading-7 outline-none placeholder:text-zinc-400"
          />

          {selectedTags.map((t) => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}

          {showTagPanel ? (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => {
                    clearSuccessIfAny();
                    setTagInput(e.target.value);
                  }}
                  placeholder="输入标签"
                  className="h-9 w-full rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    clearSuccessIfAny();
                    addTag(tagInput);
                    setTagInput("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    clearSuccessIfAny();
                    addTag(tagInput);
                    setTagInput("");
                  }}
                  disabled={pending}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-black/[.08] bg-transparent px-3 text-sm disabled:opacity-60 dark:border-white/[.145]"
                >
                  添加
                </button>
              </div>

              {selectedTags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-full border border-black/[.10] bg-black/[.04] px-3 py-1 text-xs text-zinc-800 disabled:opacity-60 dark:border-white/[.14] dark:bg-white/[.06] dark:text-zinc-200"
                      title="点击移除"
                    >
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      {t}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : selectedTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-black/[.10] bg-black/[.04] px-3 py-1 text-xs text-zinc-800 dark:border-white/[.14] dark:bg-white/[.06] dark:text-zinc-200"
                >
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                保存日期
              </span>
              <input
                name="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => {
                  clearSuccessIfAny();
                  setEventDate(e.target.value);
                }}
                className="h-9 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                图片（可选）
              </span>
              <input name="image" type="file" accept="image/*" className="text-sm" />
            </label>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="min-h-5 text-xs text-zinc-600 dark:text-zinc-400">
              {state.ok === false ? state.message : ""}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  disabled={pending}
                  className={underlineButtonClass(showSaveMenu)}
                  onClick={() => {
                    clearSuccessIfAny();
                    setShowSaveMenu((v) => !v);
                    setShowTagPanel(false);
                  }}
                  aria-expanded={showSaveMenu}
                >
                  保存
                </button>

                {showSaveMenu ? (
                  <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-lg border border-black/[.08] bg-white shadow-sm dark:border-white/[.145] dark:bg-black">
                    <button
                      type="submit"
                      name="category"
                      value="MOMENT"
                      disabled={pending}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[.04] disabled:opacity-60 dark:hover:bg-white/[.06]"
                    >
                      瞬间逝去
                    </button>
                    <button
                      type="submit"
                      name="category"
                      value="BOOK_MOVIE"
                      disabled={pending}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[.04] disabled:opacity-60 dark:hover:bg-white/[.06]"
                    >
                      书籍电影摘抄
                    </button>
                    <button
                      type="submit"
                      name="category"
                      value="TRAVEL"
                      disabled={pending}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[.04] disabled:opacity-60 dark:hover:bg-white/[.06]"
                    >
                      行走轨道之外
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                disabled={pending}
                className={underlineButtonClass(showTagPanel)}
                onClick={() => {
                  clearSuccessIfAny();
                  setShowTagPanel((v) => !v);
                  setShowSaveMenu(false);
                }}
                aria-expanded={showTagPanel}
              >
                标签
              </button>
            </div>
          </div>
      </form>

      {allTags.length > 0 ? (
        <div className="md:col-start-1 md:row-start-2">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            标签
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {allTags.map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    clearSuccessIfAny();
                    toggleTag(t);
                  }}
                  className={
                    "rounded-full border px-3 py-1 text-xs transition-colors " +
                    (active
                      ? "border-foreground bg-foreground text-background"
                      : "border-black/[.08] bg-transparent text-zinc-700 hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-white/[.06]")
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 md:col-start-2 md:row-start-1">
        <AiFriendPanel text={text} />
      </div>
    </div>
  );
}
