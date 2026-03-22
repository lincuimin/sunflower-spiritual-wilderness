import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "向日葵·精神荒野",
  description: "一个关于写作、音乐与思考的个人空间",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer
          className="text-center py-8 mt-16"
          style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}
        >
          <p>向日葵·精神荒野 &copy; {new Date().getFullYear()}</p>
        </footer>
      </body>
    </html>
  );
}
