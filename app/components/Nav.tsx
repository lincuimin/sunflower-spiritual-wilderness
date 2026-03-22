"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/writing", label: "写作" },
  { href: "/music", label: "听歌" },
  { href: "/ai", label: "AI" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link
          href="/"
          className="font-bold text-lg tracking-wide"
          style={{ color: "var(--accent)" }}
        >
          🌻 精神荒野
        </Link>
        <div className="flex gap-1">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--card)" : "var(--text)",
                  backgroundColor: active ? "var(--accent)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
