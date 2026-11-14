import { getApiUrl } from "@/util/apiConfig";
import {
  type ContentfulUser,
  normalizeContentfulAuthors,
} from "@/util/authorRepository";

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
    Entry?: ContentfulUser[];
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
const normalizeContentful = (
  data: ContentfulBlogs,
  isDetail = false,
): BlogEntry[] => {
  const authorIds = new Set(
    data.items.flatMap((item) =>
      (item.fields.user ?? []).map((user) => user.sys.id),
    ),
  );
  const authors = normalizeContentfulAuthors({
    items: (data.includes?.Entry ?? []).filter((entry) =>
      authorIds.has(entry.sys.id),
    ),
    includes: data.includes,
  });
  const authorsById = new Map(authors.map((author) => [author.id, author]));
  return data.items.map((item) => {
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
      body: isDetail
        ? () => Promise.resolve(item.fields.body ?? "")
        : () => loadBlogBody(item.sys.id),
      source: "contentful",
      authors: (item.fields.user ?? []).flatMap((user) => {
        const author = authorsById.get(user.sys.id);
        return author ? [author] : [];
      }),
      tags,
    };
  });
};
const normalizeToybox = (item: ToyboxBlog, isDetail = false): BlogEntry => {
  const published = item.published_at;
  const later = (date: string) =>
    published && Date.parse(published) > Date.parse(date) ? published : date;
  return {
    id: item.id,
    title: item.title,
    digest: item.body_text.replace(/\s+/g, " ").slice(0, 200),
    createdAt: later(item.created_at),
    updatedAt: later(item.updated_at),
    thumbnail: secureUrl(item.thumbnail.url),
    authorIds: [item.user.id],
    tagIds: item.tags.map((tag) => tag.id),
    body: isDetail
      ? () => Promise.resolve(item.body_text)
      : () => loadBlogBody(item.id),
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
const CONTENTFUL_LIST_FIELDS =
  "sys,fields.title,fields.digest,fields.thumbnail,fields.user,fields.tags";
const getContentful = async (
  params: Record<string, string>,
  isDetail = false,
): Promise<BlogEntry[]> => {
  const space = import.meta.env.VITE_CTF_SPACE_ID;
  const token = import.meta.env.VITE_CTF_CDA_ACCESS_TOKEN;
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
      limit: isDetail ? "1" : "100",
      skip: String(entries.length),
      order: "-sys.createdAt",
      ...(isDetail ? {} : { select: CONTENTFUL_LIST_FIELDS }),
      ...params,
    }))
      url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new BlogApiError(response.status);
    const data = (await response.json()) as ContentfulBlogs;
    if (
      !Array.isArray(data.items) ||
      !Number.isInteger(data.total) ||
      data.total < 0
    )
      throw new Error("Invalid Contentful blogs response");
    total = data.total;
    if (!data.items.length && entries.length < total)
      throw new Error("Contentful blog pagination ended early");
    entries.push(...normalizeContentful(data, isDetail));
  } while (entries.length < total);
  return entries;
};
const toyboxRequest = async <T>(path: string): Promise<T> => {
  const response = await fetch(getApiUrl(`/api/v1${path}`), {
    credentials: "omit",
  });
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
    ).then((data) => {
      if (!Array.isArray(data.blogs))
        throw new Error("Invalid Toybox blogs response");
      return data.blogs.map((item) => normalizeToybox(item));
    }),
  ]);
  const entries: BlogEntry[] = [];
  const unavailableSources: string[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") entries.push(...result.value);
    else unavailableSources.push(index === 0 ? "Contentful" : "Toybox");
  }
  if (unavailableSources.length === 2)
    throw new Error("ブログを読み込めませんでした。");
  return {
    entries: entries.sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        a.id.localeCompare(b.id),
    ),
    unavailableSources,
  };
};
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const getBlog = async (id: string): Promise<BlogEntry | undefined> => {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return undefined;
  if (!UUID_PATTERN.test(id))
    return (await getContentful({ "sys.id": id }, true))[0];
  try {
    return normalizeToybox(
      await toyboxRequest<ToyboxBlog>(`/blogs/${encodeURIComponent(id)}`),
      true,
    );
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) return undefined;
    throw error;
  }
};
const loadBlogBody = async (id: string): Promise<string> => {
  const entry = await getBlog(id);
  if (!entry) throw new Error("ブログが見つかりません。");
  return entry.body();
};
