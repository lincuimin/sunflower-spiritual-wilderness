import OpenAI from "openai";

type AiProvider = "openai" | "deepseek";

function normalizeProvider(value: unknown): AiProvider {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "deepseek") return "deepseek";
  return "openai";
}

function parsePositiveInt(value: unknown): number | undefined {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function getAiProvider(): AiProvider {
  return normalizeProvider(process.env.AI_PROVIDER);
}

export function getAiApiKey(): string | null {
  const provider = getAiProvider();

  const keyFromGeneric = String(process.env.AI_API_KEY ?? "").trim();
  if (keyFromGeneric) return keyFromGeneric;

  if (provider === "deepseek") {
    const key = String(process.env.DEEPSEEK_API_KEY ?? "").trim();
    if (key) return key;
  }

  const openAiKey = String(process.env.OPENAI_API_KEY ?? "").trim();
  return openAiKey || null;
}

export function getAiBaseUrl(): string | undefined {
  const generic = String(process.env.AI_BASE_URL ?? "").trim();
  if (generic) return generic;

  const legacy = String(process.env.OPENAI_BASE_URL ?? "").trim();
  if (legacy) return legacy;

  const provider = getAiProvider();
  if (provider === "deepseek") {
    return "https://api.deepseek.com/v1";
  }

  return undefined;
}

export function getAiTimeoutMs(): number | undefined {
  return (
    parsePositiveInt(process.env.AI_TIMEOUT_MS) ??
    parsePositiveInt(process.env.OPENAI_TIMEOUT_MS)
  );
}

export function getAiModel(): string {
  const model = String(process.env.AI_MODEL ?? "").trim();
  if (model) return model;

  const provider = getAiProvider();
  if (provider === "deepseek") return "deepseek-chat";

  const legacy = String(process.env.OPENAI_MODEL ?? "").trim();
  if (legacy) return legacy;

  return "gpt-4o-mini";
}

export function getAiClient(): OpenAI | null {
  const apiKey = getAiApiKey();
  if (!apiKey) return null;

  const baseURL = getAiBaseUrl();
  const timeout = getAiTimeoutMs();

  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    ...(timeout ? { timeout } : {}),
  });
}
