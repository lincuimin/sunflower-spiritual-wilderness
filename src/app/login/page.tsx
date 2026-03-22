import { LoginForm } from "./LoginForm";
import { KeyRound } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-zinc-50 to-sky-50 px-6 py-10 font-sans text-foreground dark:from-zinc-950 dark:via-black dark:to-slate-950">
      <main className="mx-auto w-full max-w-md rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold">
          <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          登录
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          仅管理员可访问。
        </p>

        <LoginForm next={next ?? "/"} />

        <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
          提示：管理员账号与密码从环境变量读取。
        </p>
      </main>
    </div>
  );
}
