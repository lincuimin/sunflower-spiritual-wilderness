import Link from "next/link";
import { BookOpen, Home, Map, MessageCircle, PencilLine } from "lucide-react";

const navItems = [
  { href: "/write", label: "写文字", Icon: PencilLine, iconClassName: "text-pink-600" },
  { href: "/moments", label: "瞬间逝去", Icon: MessageCircle, iconClassName: "text-sky-600" },
  { href: "/books-movies", label: "书籍电影摘抄", Icon: BookOpen, iconClassName: "text-violet-600" },
  { href: "/travel", label: "行走轨道之外", Icon: Map, iconClassName: "text-emerald-600" },
] as const;

export function NavBar() {
  return (
    <header className="w-full border-b border-black/[.08] bg-gradient-to-r from-white via-pink-50/60 to-sky-50/60 dark:border-white/[.145] dark:from-black dark:via-fuchsia-950/20 dark:to-sky-950/20">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          aria-label="Home"
        >
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 text-pink-600 ring-1 ring-black/[.06] dark:bg-white/5 dark:text-pink-400 dark:ring-white/[.12]"
            aria-hidden="true"
          >
            <Home className="h-4 w-4" />
          </span>
          向日葵的精神原野
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-zinc-700 hover:bg-black/[.04] hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/[.06]"
            >
              <item.Icon className={`h-4 w-4 ${item.iconClassName}`} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
