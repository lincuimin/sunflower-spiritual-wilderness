import { NextResponse } from "next/server";
import { requireSessionSubject } from "@/lib/auth";
import { getAiClient, getAiModel } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    try {
      await requireSessionSubject();
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const client = getAiClient();
    if (!client) {
      return NextResponse.json(
        { error: "Missing AI_API_KEY (or provider-specific key)" },
        { status: 500 },
      );
    }

    const body = (await req.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length < 10) {
      return NextResponse.json({});
    }

    const prompt = `你是一个中文写作助手。用户正在写一段文字，请输出一个 JSON（不要输出多余解释），格式如下：
{
  "title": string,
  "summary": string,
  "category": "MOMENT" | "BOOK_MOVIE" | "TRAVEL",
  "keywords": string[]
}
要求：
- title：不超过 20 个字
- summary：不超过 120 个字
- category：根据内容判断更适合：瞬间逝去(MOMENT)/书籍电影摘抄(BOOK_MOVIE)/行走轨道之外(TRAVEL)
- keywords：3 个关键词
文字如下：\n\n${text}`;

    const res = await client.chat.completions.create({
      model: getAiModel(),
      temperature: 0.2,
      messages: [
        { role: "system", content: "只输出 JSON，不要输出任何解释或额外文本。" },
        { role: "user", content: prompt },
      ],
    });

    const content = res.choices?.[0]?.message?.content ?? "";
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    const slice = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(slice);
    } catch {
      parsed = {};
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const status =
      typeof (e as { status?: unknown })?.status === "number"
        ? ((e as { status: number }).status ?? 500)
        : 500;

    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "AI failed";

    console.error("/api/ai/activity failed", { status, message });

    return NextResponse.json({ error: message }, { status });
  }
}
