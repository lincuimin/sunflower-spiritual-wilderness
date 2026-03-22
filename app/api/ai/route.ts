import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) {
    // Return a friendly mock response when no API key is configured
    const last = messages?.at(-1)?.content ?? "";
    const reply = generateMockReply(last);
    return NextResponse.json({ content: reply });
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "你是一个温暖、有智慧的助手，擅长用中文交流。你的名字叫「小葵」，是一个爱好哲学、文学和音乐的 AI 朋友。",
          },
          ...messages,
        ],
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `API 错误: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "抱歉，我没有理解你的意思。";
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json(
      { error: `请求失败: ${e instanceof Error ? e.message : "未知错误"}` },
      { status: 500 }
    );
  }
}

function generateMockReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("你好") || lower.includes("hi") || lower.includes("hello")) {
    return "你好！我是小葵 🌻 很高兴认识你！虽然我目前在离线模式下运行，但我们仍然可以聊天。想聊些什么呢？";
  }
  if (lower.includes("音乐") || lower.includes("歌")) {
    return "音乐是灵魂的语言 🎵 你最近在听什么类型的音乐？我特别喜欢那些能触动内心的旋律，无论是轻柔的古典乐还是充满活力的流行曲。";
  }
  if (lower.includes("写作") || lower.includes("文章") || lower.includes("写")) {
    return "写作是一种美妙的表达方式 ✍️ 把内心的想法化为文字，既是一种记录，也是一种释放。你最近在写什么主题的文章？";
  }
  if (lower.includes("推荐") || lower.includes("书")) {
    return "我推荐你读《百年孤独》——马尔克斯的魔幻现实主义让人沉醉。还有《挪威的森林》，村上春树的文字如同一首悠长的歌曲 📚";
  }
  if (lower.includes("生活") || lower.includes("人生") || lower.includes("意义")) {
    return "生活的意义往往藏在那些细小的瞬间里——清晨阳光照进窗户的那一刻，听到一首触动内心的歌曲，或是写下一段让自己满意的文字 🌟";
  }
  return `感谢你和我分享「${input.slice(0, 20)}${input.length > 20 ? "..." : ""}」。这让我想到很多。如果你想让我给出更有深度的回答，可以配置 OpenAI API 密钥（在 .env.local 中设置 OPENAI_API_KEY）来开启完整的 AI 对话功能 🌻`;
}
