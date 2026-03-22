import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "session";

function debugAuth(message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  // Intentionally logs only masked/structural info (never plaintext password).
  console.warn("[auth] " + message, data ?? "");
}

function maskValue(value: string) {
  const v = String(value);
  return {
    length: v.length,
    startsWith: v.slice(0, 6),
    endsWith: v.slice(-6),
    json: JSON.stringify(v),
  };
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  sub: string;
};

export async function createSessionCookie(subject: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionSubject(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function requireSessionSubject() {
  const subject = await readSessionSubject();
  if (!subject) {
    throw new Error("UNAUTHORIZED");
  }
  return subject;
}

export async function verifyAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedHashRaw = process.env.ADMIN_PASSWORD_HASH;

  const expectedHash = (() => {
    const raw = String(expectedHashRaw ?? "");
    let value = raw.replace(/^\uFEFF/, "").trim();
    // Some env loaders may keep wrapping quotes; strip a single pair.
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Support escaping dollars as \$ in .env to avoid expansion.
    value = value.replace(/\\\$/g, "$");
    return value.replace(/^\uFEFF/, "").trim();
  })();

  if (!expectedUser || !expectedHash) {
    debugAuth("missing env", {
      hasUser: Boolean(expectedUser),
      rawHash: expectedHashRaw == null ? null : maskValue(String(expectedHashRaw)),
      normalizedHash: maskValue(expectedHash),
    });
    return {
      ok: false as const,
      message:
        "缺少 ADMIN_USERNAME 或 ADMIN_PASSWORD_HASH。请检查 .env 并重启 dev 服务（Ctrl+C 后重新 npm run dev）。",
    };
  }

  // bcrypt hashes typically start with $2a$ / $2b$ / $2y$.
  // If it doesn't, it's usually because:
  // 1) You accidentally put plaintext into ADMIN_PASSWORD_HASH, or
  // 2) The $ signs were expanded/stripped by dotenv expansion.
  if (!/^\$2[aby]\$/.test(expectedHash)) {
    debugAuth("hash not bcrypt", {
      rawHash: expectedHashRaw == null ? null : maskValue(String(expectedHashRaw)),
      normalizedHash: maskValue(expectedHash),
    });
    return {
      ok: false as const,
      message:
        "ADMIN_PASSWORD_HASH 看起来不是 bcrypt hash（应以 $2a$/$2b$/$2y$ 开头）。如果你填的是明文，请用 README 里的命令生成 hash；如果你填的是 hash，但开头的 $2b$... 被吞了，请在 .env 里把每个 `$` 写成 `\\$` 转义（例如 ADMIN_PASSWORD_HASH=\"\\$2b\\$10\\$...\"），然后重启 dev 服务。",
    };
  }

  if (username !== expectedUser) {
    debugAuth("username mismatch", { input: username, expected: expectedUser });
    return { ok: false as const, message: "账号不正确" };
  }

  const passwordOk = await bcrypt.compare(password, expectedHash);
  if (!passwordOk) {
    // Be forgiving about accidental whitespace in password input.
    const trimmed = password.trim();
    const passwordOkTrimmed = trimmed !== password && (await bcrypt.compare(trimmed, expectedHash));
    if (!passwordOkTrimmed) {
      debugAuth("password mismatch", {
        normalizedHash: maskValue(expectedHash),
      });
      return { ok: false as const, message: "密码不正确" };
    }
  }

  return { ok: true as const };
}
