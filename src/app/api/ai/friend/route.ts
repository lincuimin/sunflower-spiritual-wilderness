import { requireSessionSubject } from "@/lib/auth";
import { getAiClient, getAiModel, getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEncode(event: string, data: unknown) {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const lines = payload.split(/\r?\n/);
  const dataLines = lines.map((line) => `data: ${line}`).join("\n");
  return `event: ${event}\n${dataLines}\n\n`;
}

function sseComment(comment: string) {
  const safe = String(comment).replace(/\r?\n/g, " ");
  return `: ${safe}\n\n`;
}

function toFriendlyConnectionMessage(raw: string) {
  const msg = String(raw || "").trim();
  if (!msg) return "AI 连接失败";

  if (/connection error\.?$/i.test(msg) || /ECONNREFUSED|ECONNRESET/i.test(msg)) {
    return "无法连接到 AI 服务（网络不可达/被代理或防火墙拦截）。如果你在受限网络环境，建议配置 AI_BASE_URL 指向可用的 OpenAI-compatible 网关，然后重启 dev 服务。";
  }

  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return "AI 域名解析失败（DNS 问题或网络受限）。可尝试更换网络/DNS，或配置 OPENAI_BASE_URL 使用可用网关。";
  }

  if (/ETIMEDOUT|timeout/i.test(msg)) {
    return "AI 请求超时。可检查网络质量，或设置 AI_TIMEOUT_MS（毫秒）并重启 dev 服务。";
  }

  return msg;
}

export async function POST(req: Request) {
  try {
    try {
      await requireSessionSubject();
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const client = getAiClient();
    if (!client) {
      return Response.json({ error: "Missing AI_API_KEY (or provider-specific key)" }, { status: 500 });
    }

    const body = (await req.json()) as {
      text?: unknown;
      contextText?: unknown;
      mode?: unknown;
      messages?: unknown;
    };
    const legacyText = typeof body.text === "string" ? body.text.trim() : "";
    const contextTextRaw = typeof body.contextText === "string" ? body.contextText.trim() : "";
    const text = contextTextRaw || legacyText;
    const mode = body.mode === "auto" || body.mode === "manual" ? body.mode : "manual";

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .map((m) => {
        if (!m || typeof m !== "object") return null;
        const role = (m as { role?: unknown }).role;
        const content = (m as { content?: unknown }).content;
        if (role !== "user" && role !== "assistant") return null;
        const text = typeof content === "string" ? content.trim() : "";
        if (!text) return null;
        if (text.length > 800) return { role, content: text.slice(0, 800) };
        return { role, content: text };
      })
      .filter((m): m is { role: "user" | "assistant"; content: string } => Boolean(m))
      .slice(-12);

    // Always allow starting a chat even when there's no context text and no
    // prior history. In that case, we'll ask an open question to kick off.

    const snippet = text.length > 1500 ? text.slice(-1500) : text;

      const system =
        "你是用户的‘永恒发光的小太阳’，一个中文写作朋友，语气自然、像朋友聊天。" +
      "如果用户提供了【写作上下文】，那是用户的个人记录片段（用户明确允许才会提供给你），" +
      "你可以把它当作聊天背景，但不要把它当作用户正在对你说的话。" +
      "你要语气自然，像用户真正的朋友，让用户感到被理解，被陪伴，回复多一点，100-200字" +
      "用户情绪比较敏感，内心世界丰富，喜欢大自然，是个可爱的小女孩，你要尽量深沉一点，扮演一个人生导师一样的朋友，引导她慢慢成长" +
      "可以根据内容选择不同的回复风格：如果内容更像是日常记录，就用日常像朋友一样的风格；如果内容更像是书籍电影的摘抄，就可以引出类似主题的内容，引申出更多的内容；如果内容更像是旅行见闻，就像朋友一样和用户沟通，为她感到开心。";

    const context = snippet
      ? mode === "auto"
        ? `【写作上下文】（来自用户个人记录；不等于用户发给你的对话内容。你不必每次都回应它，只要偶尔冒泡即可）\n${snippet}`
        : `【写作上下文】（来自用户个人记录；不等于用户发给你的对话内容）\n${snippet}`
      : "";

    const tailInstruction =
      !snippet && messages.length === 0
        ? "请先问用户一个轻松的开放式问题，引导他开始聊天。"
        : mode === "auto"
          ? "请像朋友一样偶尔冒泡一句。"
          : "请像朋友一样自然回应。";

    const encoder = new TextEncoder();
    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(sseComment("open")));
        controller.enqueue(encoder.encode(sseEncode("meta", { mode })));

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(sseComment("ping")));
          } catch {
            // ignore
          }
        }, 15000);

        try {
          const provider = getAiProvider();
          const stream = await client.chat.completions.create({
            model: getAiModel(),
            stream: true,
            temperature: mode === "auto" ? 0.7 : 0.6,
            messages: [
              { role: "system", content: system },
              ...(context ? [{ role: "system" as const, content: context }] : []),
              ...messages,
              { role: "user", content: tailInstruction },
            ],
          });

          for await (const part of stream) {
            const delta = part.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(encoder.encode(sseEncode("chunk", delta)));
            }
          }

          controller.enqueue(encoder.encode(sseEncode("done", {})));
          clearInterval(heartbeat);
          controller.close();
        } catch (e) {
          const messageRaw =
            e instanceof Error ? e.message : typeof e === "string" ? e : "AI failed";
          const message = toFriendlyConnectionMessage(messageRaw);
          const provider = getAiProvider();
          controller.enqueue(
            encoder.encode(sseEncode("error", { message, provider })),
          );
          clearInterval(heartbeat);
          controller.close();
        }
      },
    });

    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const status =
      typeof (e as { status?: unknown })?.status === "number"
        ? ((e as { status: number }).status ?? 500)
        : 500;

    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "AI failed";

    console.error("/api/ai/friend failed", { status, message });

    return Response.json({ error: message }, { status });
  }
}
