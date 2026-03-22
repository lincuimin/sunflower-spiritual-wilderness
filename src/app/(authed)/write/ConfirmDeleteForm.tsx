"use client";

import { useCallback } from "react";

export function ConfirmDeleteForm({
  id,
  action,
}: {
  id: number;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("确定删除？此操作无法撤销。");
    if (!ok) e.preventDefault();
  }, []);

  return (
    <form action={action} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        删除
      </button>
    </form>
  );
}
