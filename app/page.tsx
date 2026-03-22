import Link from "next/link";

const features = [
  {
    href: "/writing",
    emoji: "✍️",
    title: "写作",
    desc: "记录思想，分享故事。在这里留下文字的痕迹，让每一个瞬间都有意义。",
    color: "#e8f4f8",
    border: "#3498db",
  },
  {
    href: "/music",
    emoji: "🎵",
    title: "听歌",
    desc: "音乐是灵魂的语言。在旋律中找到共鸣，让音乐陪伴每一个平凡的时刻。",
    color: "#f8f0e8",
    border: "#e67e22",
  },
  {
    href: "/ai",
    emoji: "🤖",
    title: "AI 对话",
    desc: "与 AI 交流想法，探索未知。智慧的碰撞让思维走得更远。",
    color: "#f0f8e8",
    border: "#27ae60",
  },
];

export default function Home() {
  return (
    <div className="py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-4">🌻</div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
          向日葵·精神荒野
        </h1>
        <p className="text-xl" style={{ color: "var(--muted)" }}>
          一片属于自己的精神角落
        </p>
        <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
          在这里，写作留住岁月，音乐抚慰心灵，AI 拓展思维的边界
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group block rounded-2xl p-6 transition-transform hover:-translate-y-1"
            style={{
              backgroundColor: f.color,
              border: `1px solid ${f.border}30`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div className="text-4xl mb-3">{f.emoji}</div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: f.border }}
            >
              {f.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {f.desc}
            </p>
            <div
              className="mt-4 text-sm font-medium"
              style={{ color: f.border }}
            >
              前往 →
            </div>
          </Link>
        ))}
      </div>

      {/* Quote */}
      <div
        className="mt-16 text-center py-8 px-6 rounded-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-lg italic" style={{ color: "var(--muted)" }}>
          "在荒野中，向日葵永远朝着太阳。"
        </p>
      </div>
    </div>
  );
}
