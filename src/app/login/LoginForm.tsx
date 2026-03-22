"use client";

import { useActionState } from "react";
import type { LoginState } from "./actions";
import { loginAction } from "./actions";

const initialState: LoginState = { ok: true };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">账号</span>
        <input
          name="username"
          className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
          autoComplete="username"
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">密码</span>
        <input
          name="password"
          type="password"
          className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
          autoComplete="current-password"
          required
        />
      </label>

      {state.ok === false ? (
        <div className="rounded-lg border border-black/[.08] bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-black dark:text-zinc-300">
          {state.message ?? "登录失败"}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
