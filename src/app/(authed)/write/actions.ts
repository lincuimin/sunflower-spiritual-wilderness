"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireSessionSubject } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostCategory } from "@/generated/prisma";

export type CreatePostState =
  | { ok: true; justSaved: boolean }
  | { ok: false; message: string };

export type UpdatePostState =
  | { ok: true; justSaved: boolean }
  | { ok: false; message: string };

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function parseCategory(value: string): PostCategory | null {
  if (value === "MOMENT") return PostCategory.MOMENT;
  if (value === "BOOK_MOVIE") return PostCategory.BOOK_MOVIE;
  if (value === "TRAVEL") return PostCategory.TRAVEL;
  return null;
}

function parseEventDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function uploadImageIfAny(file: unknown): Promise<string | null> {
  if (!(file instanceof File)) return null;
  if (file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("图片过大（最大 5MB）");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeExt = ext && ext.length <= 10 ? `.${ext}` : "";
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}${safeExt}`;

  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  return blob.url;
}

export async function createPostAction(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  try {
    await requireSessionSubject();

    const titleRaw = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const categoryRaw = String(formData.get("category") ?? "");
    const eventDateRaw = String(formData.get("eventDate") ?? "");

    const tagsRaw = formData
      .getAll("tags")
      .map((t) => String(t).trim())
      .filter(Boolean);

    if (!content) return { ok: false, message: "请输入文字内容" };

    const category = parseCategory(categoryRaw);
    if (!category) return { ok: false, message: "请选择保存分类" };

    const eventDate = parseEventDate(eventDateRaw);
    if (!eventDate) return { ok: false, message: "请选择保存日期" };

    let imageUrl: string | null = null;
    try {
      imageUrl = await uploadImageIfAny(formData.get("image"));
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "图片上传失败",
      };
    }

    const title = titleRaw.length > 0 ? titleRaw : null;
    const tags = Array.from(new Set(tagsRaw));
    const shouldSaveTags = tags.length > 0;

    await prisma.post.create({
      data: {
        title,
        content,
        category,
        eventDate,
        imageUrl,
        ...(shouldSaveTags
          ? {
              tags: {
                create: tags.map((name) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name },
                      create: { name },
                    },
                  },
                })),
              },
            }
          : {}),
      },
    });

    revalidatePath("/moments");
    revalidatePath("/books-movies");
    revalidatePath("/travel");

    return { ok: true, justSaved: true };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, message: "请先登录后再保存" };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : "保存失败",
    };
  }
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireSessionSubject();

  const idRaw = String(formData.get("id") ?? "");
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) return;

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, category: true },
  });
  if (!existing) return;

  await prisma.post.delete({ where: { id } });

  if (existing.category === PostCategory.MOMENT) revalidatePath("/moments");
  if (existing.category === PostCategory.BOOK_MOVIE) revalidatePath("/books-movies");
  if (existing.category === PostCategory.TRAVEL) revalidatePath("/travel");
}

export async function updatePostAction(
  _prevState: UpdatePostState,
  formData: FormData,
): Promise<UpdatePostState> {
  try {
    await requireSessionSubject();

    const idRaw = String(formData.get("id") ?? "");
    const id = Number.parseInt(idRaw, 10);
    if (!Number.isFinite(id)) return { ok: false, message: "参数错误" };

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true, category: true },
    });
    if (!existing) return { ok: false, message: "内容不存在" };

    const titleRaw = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const eventDateRaw = String(formData.get("eventDate") ?? "");

    if (!content) return { ok: false, message: "请输入文字内容" };

    const eventDate = parseEventDate(eventDateRaw);
    if (!eventDate) return { ok: false, message: "请选择保存日期" };

    const title = titleRaw.length > 0 ? titleRaw : null;

    const tagsRaw = formData
      .getAll("tags")
      .map((t) => String(t).trim())
      .filter(Boolean);

    const tags = Array.from(new Set(tagsRaw));
    const shouldSaveTags = existing.category === PostCategory.MOMENT;

    await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        eventDate,
        ...(shouldSaveTags
          ? {
              tags: {
                deleteMany: {},
                ...(tags.length > 0
                  ? {
                      create: tags.map((name) => ({
                        tag: {
                          connectOrCreate: {
                            where: { name },
                            create: { name },
                          },
                        },
                      })),
                    }
                  : {}),
              },
            }
          : {}),
      },
    });

    if (existing.category === PostCategory.MOMENT) revalidatePath("/moments");
    if (existing.category === PostCategory.BOOK_MOVIE) revalidatePath("/books-movies");
    if (existing.category === PostCategory.TRAVEL) revalidatePath("/travel");

    return { ok: true, justSaved: true };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, message: "请先登录后再编辑" };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : "编辑失败",
    };
  }
}
