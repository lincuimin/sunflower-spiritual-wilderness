"use server";

import { redirect } from "next/navigation";
import { createSessionCookie, verifyAdminCredentials } from "@/lib/auth";

export type LoginState = { ok: boolean; message?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!username || !password) {
    return { ok: false, message: "请输入账号和密码" };
  }

  const result = await verifyAdminCredentials(username, password);
  if (!result.ok) return { ok: false, message: result.message ?? "账号或密码错误" };

  await createSessionCookie(username);
  redirect(next.startsWith("/") ? next : "/");
}
