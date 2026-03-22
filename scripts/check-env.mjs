import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "node:readline";

function maskInfo(value) {
  if (!value) return { present: false };
  const v = String(value);
  return {
    present: true,
    length: v.length,
    sample: v.slice(0, 4) + "..." + v.slice(-4),
  };
}

function printSection(title) {
  console.log("\n== " + title + " ==");
}

printSection("Env status");
console.log({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: maskInfo(process.env.DATABASE_URL),
  AUTH_SECRET: maskInfo(process.env.AUTH_SECRET),
  ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? null,
  ADMIN_PASSWORD_HASH: maskInfo(process.env.ADMIN_PASSWORD_HASH),
  AI_PROVIDER: process.env.AI_PROVIDER ?? null,
  AI_API_KEY: maskInfo(process.env.AI_API_KEY),
  DEEPSEEK_API_KEY: maskInfo(process.env.DEEPSEEK_API_KEY),
  AI_BASE_URL: process.env.AI_BASE_URL ?? null,
  AI_MODEL: process.env.AI_MODEL ?? null,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS ?? null,
  OPENAI_API_KEY: maskInfo(process.env.OPENAI_API_KEY),
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ?? null,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? null,
  OPENAI_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS ?? null,
  BLOB_READ_WRITE_TOKEN: maskInfo(process.env.BLOB_READ_WRITE_TOKEN),
});

printSection("Quick checks");
if (!process.env.AUTH_SECRET) console.log("- 缺少 AUTH_SECRET（必须）");
if (!process.env.ADMIN_USERNAME) console.log("- 缺少 ADMIN_USERNAME（必须）");
if (!process.env.ADMIN_PASSWORD_HASH) console.log("- 缺少 ADMIN_PASSWORD_HASH（必须）");
if (!process.env.DATABASE_URL) console.log("- 缺少 DATABASE_URL（必须）");

if (!process.stdin.isTTY) {
  console.log("\n(非交互终端，跳过密码校验。)");
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

(async () => {
  const answer = String(await ask("\n要现在模拟一次登录校验吗？(y/N) ")).trim().toLowerCase();
  if (answer !== "y" && answer !== "yes") {
    rl.close();
    return;
  }

  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.log("\n未设置 ADMIN_PASSWORD_HASH，无法校验。");
    rl.close();
    return;
  }

  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const username = String(await ask("请输入你打算登录的账号： "));
  const password = String(await ask("请输入你打算用来登录的明文密码（会回显到屏幕）： "));

  const usernameOk = username.trim() === expectedUser;
  const okRaw = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
  const okTrimmed = bcrypt.compareSync(password.trim(), process.env.ADMIN_PASSWORD_HASH);

  console.log("\n账号校验：", usernameOk ? "✅ 账号匹配" : "❌ 账号不匹配");
  if (!usernameOk) {
    console.log("- 期望账号：", JSON.stringify(expectedUser));
    console.log("- 你输入的：", JSON.stringify(username.trim()));
  }

  console.log("\n密码校验：");
  console.log("- 按原样比较：", okRaw ? "✅ 匹配" : "❌ 不匹配");
  console.log("- 去掉首尾空格后比较：", okTrimmed ? "✅ 匹配" : "❌ 不匹配");

  if (usernameOk && (okRaw || okTrimmed)) {
    console.log("\n结论：环境变量与账号/密码本身没问题。若网页仍提示错误，请确认已重启 `npm run dev` 并用无痕窗口重试。\n");
  } else {
    console.log("\n结论：网页提示错误是合理的（账号或密码不匹配）。\n");
  }
  rl.close();
})();
