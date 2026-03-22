import { TimeNow } from "@/components/TimeNow";
import { readSessionSubject } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Sparkles } from "lucide-react";

const tiles = [
  {
    imageSrc: "/home/picture1.jpg",
  },
  {
    imageSrc: "/home/picture2.jpg",
  },
  {
    imageSrc: "/home/picture3.jpg",
  },
  {
    imageSrc: "/home/picture4.jpg",
  },
  {
    imageSrc: "/home/picture5.jpg",
  },
  {
    imageSrc: "/home/picture6.jpg",
  },
] as const;

export default async function Home() {
  // Defense-in-depth: even if middleware doesn't run for '/', don't show the
  // authed home to unauthenticated users.
  const subject = await readSessionSubject();
  if (!subject) {
    redirect("/login?next=/");
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-pink-50 via-zinc-50 to-sky-50 px-6 py-6 font-sans text-foreground dark:from-zinc-950 dark:via-black dark:to-slate-950">
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <div className="w-full max-w-3xl text-center">
          <h1 className="inline-flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="h-6 w-6 text-pink-600 dark:text-pink-400" aria-hidden="true" />
          主页
          </h1>
          <div className="mt-2 flex justify-center">
            <TimeNow />
          </div>
        </div>

        <section className="mt-6 w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t, idx) => (
              <div
                key={t.imageSrc}
                className="relative min-h-56 overflow-hidden rounded-xl border border-black/[.08] bg-white/70 dark:border-white/[.145] dark:bg-white/5"
              >
                <Image
                  src={t.imageSrc}
                  alt={`主页图片 ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                  priority={idx < 3}
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
