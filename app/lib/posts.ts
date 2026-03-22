export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "sunflower_posts";

export function getPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPost(id: string): Post | undefined {
  return getPosts().find((p) => p.id === id);
}

export function savePost(post: Omit<Post, "id" | "createdAt" | "updatedAt">): Post {
  const posts = getPosts();
  const now = new Date().toISOString();
  const newPost: Post = {
    ...post,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newPost, ...posts]));
  return newPost;
}

export function updatePost(
  id: string,
  data: Partial<Pick<Post, "title" | "content">>
): Post | undefined {
  const posts = getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  posts[idx] = { ...posts[idx], ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return posts[idx];
}

export function deletePost(id: string): void {
  const posts = getPosts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
