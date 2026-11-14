import type { BlogEntry, BlogListResult } from "@/shared/types/content";

interface ContentfulLink {
  sys: { id: string };
}
interface ContentfulBlog {
  sys: { id: string; createdAt: string; updatedAt: string };
  fields: {
    title: string;
    body?: string;
    digest?: string;
    thumbnail?: ContentfulLink;
    user?: ContentfulLink[];
    tags?: ContentfulLink[];
  };
}
interface ContentfulBlogs {
  items: ContentfulBlog[];
  total: number;
  includes?: {
    Asset?: { sys: { id: string }; fields: { file?: { url?: string } } }[];
    Entry?: { sys: { id: string }; fields: { name?: string } }[];
  };
}
/** @apiContract */
interface ToyboxBlog {
  id: string;
  title: string;
  body_text: string;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  thumbnail: { url: string };
  tags: { id: string; name: string }[];
  user: { id: string; name: string; avatar_url?: string };
}
class BlogApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`Blog delivery failed (${status})`);
    this.status = status;
  }
}
const secureUrl = (url: string) =>
  url.startsWith("//") ? `https:${url}` : url;
const normalizeContentful = (data: ContentfulBlogs): BlogEntry[] =>
  data.items.map((item) => {
    const file =
      data.includes?.Asset?.find(
        (asset) => asset.sys.id === item.fields.thumbnail?.sys.id,
      )?.fields.file?.url ?? "";
    const tags = (item.fields.tags ?? []).map((tag) => ({
      id: tag.sys.id,
      name:
        data.includes?.Entry?.find((entry) => entry.sys.id === tag.sys.id)
          ?.fields.name ?? "",
    }));
    return {
      id: item.sys.id,
      title: item.fields.title,
      digest: item.fields.digest ?? "",
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt,
      thumbnail: secureUrl(file),
      authorIds: (item.fields.user ?? []).map((user) => user.sys.id),
      tagIds: tags.map((tag) => tag.id),
      isPublished: true,
      isImportant: false,
      body: () => Promise.resolve(item.fields.body ?? ""),
      source: "contentful",
      authors: [],
      tags,
    };
  });
const normalizeToybox = (item: ToyboxBlog): BlogEntry => {
  const published = item.published_at;
  const later = (date: string) =>
    published && Date.parse(published) > Date.parse(date) ? published : date;
  return {
    id: item.id,
    title: item.title,
    digest: item.body_text,
    createdAt: later(item.created_at),
    updatedAt: later(item.updated_at),
    thumbnail: secureUrl(item.thumbnail.url),
    authorIds: [item.user.id],
    tagIds: item.tags.map((tag) => tag.id),
    isPublished: true,
    isImportant: false,
    body: () => Promise.resolve(item.body_text),
    source: "toybox",
    authors: [
      {
        id: item.user.id,
        name: item.user.name,
        introduction: "",
        avatar: item.user.avatar_url ? secureUrl(item.user.avatar_url) : null,
        links: {},
        source: "toybox",
      },
    ],
    tags: item.tags,
  };
};
const getContentful = async (
  params: Record<string, string>,
): Promise<BlogEntry[]> => {
  const space = import.meta.env.VITE_CTF_SPACE_ID,
    token = import.meta.env.VITE_CTF_CDA_ACCESS_TOKEN;
  if (!space || !token)
    throw new Error("Contentful blog delivery is not configured");
  const entries: BlogEntry[] = [];
  let total = 0;
  do {
    const url = new URL(
      `https://cdn.contentful.com/spaces/${encodeURIComponent(space)}/environments/master/entries`,
    );
    for (const [key, value] of Object.entries({
      content_type: "blog",
      include: "2",
      limit: "100",
      skip: String(entries.length),
      order: "-sys.createdAt",
      ...params,
    }))
      url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new BlogApiError(response.status);
    const data = (await response.json()) as ContentfulBlogs;
    if (!Array.isArray(data.items) || typeof data.total !== "number")
      throw new Error("Invalid Contentful blogs response");
    total = data.total;
    if (!data.items.length && entries.length < total)
      throw new Error("Contentful blog pagination ended early");
    entries.push(...normalizeContentful(data));
  } while (entries.length < total);
  return entries;
};
const toyboxRequest = async <T>(path: string): Promise<T> => {
  const base = import.meta.env.VITE_TOYBOX_API_BASE_URL;
  if (!base) throw new Error("Toybox blog delivery is not configured");
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`);
  if (!response.ok) throw new BlogApiError(response.status);
  return response.json() as Promise<T>;
};
export const getAuthorBlogs = (id: string) =>
  getContentful({ "fields.user.sys.id": id });
export const getBlogs = async (): Promise<BlogListResult> => {
  const results = await Promise.allSettled([
    getContentful({}),
    toyboxRequest<{ blogs: ToyboxBlog[] }>(
      "/blogs?disable_pagination=true",
    ).then((data) => data.blogs.map(normalizeToybox)),
  ]);
  const entries: BlogEntry[] = [],
    unavailableSources: string[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") entries.push(...result.value);
    else unavailableSources.push(index === 0 ? "Contentful" : "Toybox");
  }
  if (unavailableSources.length === 2)
    throw new Error("ブログを読み込めませんでした。");
  return {
    entries: entries.sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ),
    unavailableSources,
  };
};
export const getBlog = async (
  id: string,
  source?: string,
): Promise<BlogEntry | undefined> => {
  if (source !== "toybox") {
    const entries = await getContentful({ "sys.id": id });
    if (entries[0] || source === "contentful") return entries[0];
  }
  try {
    return normalizeToybox(
      await toyboxRequest<ToyboxBlog>(`/blogs/${encodeURIComponent(id)}`),
    );
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) return undefined;
    throw error;
  }
};
