"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

export function TagFilter({
  tags,
  value,
}: {
  tags: string[];
  value: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        标签
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const next = e.target.value;
          const params = new URLSearchParams(searchParams.toString());
          if (next) params.set("tag", next);
          else params.delete("tag");
          const qs = params.toString();
          const href = qs ? `${pathname}?${qs}` : pathname;

          // Some Next/App-Router setups can keep showing stale server data after
          // updating only search params; refresh ensures server components refetch.
          startTransition(() => {
            router.replace(href);
            router.refresh();
          });
        }}
        className="h-9 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
      >
        <option value="">全部</option>
        {tags.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
