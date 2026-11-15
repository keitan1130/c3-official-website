import { getApiUrl } from "@/util/apiConfig";
import {
  type ContentfulUser,
  normalizeContentfulAuthors,
} from "@/util/authorRepository";
import {
  type ContentfulCollection,
  getContentfulPages,
  secureContentUrl,
} from "@/util/contentfulClient";

import type {
  BlogEntry,
  BlogListResult,
  BlogSummary,
} from "@/shared/types/content";

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
type ContentfulBlogs = ContentfulCollection<ContentfulBlog, ContentfulUser>;
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
const normalizeContentful = (data: ContentfulBlogs): BlogSummary[] => {
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
      kind: "blog",
      title: item.fields.title,
      digest: item.fields.digest ?? "",
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt,
      thumbnail: secureContentUrl(file),
      source: "contentful",
      authors: (item.fields.user ?? []).map((user) => ({
        id: user.sys.id,
        profile: authorsById.get(user.sys.id),
      })),
      tags,
    };
  });
};
const normalizeToybox = (item: ToyboxBlog): BlogSummary => {
  const published = item.published_at;
  const later = (date: string) =>
    published && Date.parse(published) > Date.parse(date) ? published : date;
  return {
    id: item.id,
    kind: "blog",
    title: item.title,
    digest: item.body_text.replace(/\s+/g, " ").slice(0, 200),
    createdAt: later(item.created_at),
    updatedAt: later(item.updated_at),
    thumbnail: secureContentUrl(item.thumbnail.url),
    source: "toybox",
    authors: [
      {
        id: item.user.id,
        profile: {
          id: item.user.id,
          name: item.user.name,
          introduction: "",
          avatar: item.user.avatar_url
            ? secureContentUrl(item.user.avatar_url)
            : null,
          links: {},
          source: "toybox",
        },
      },
    ],
    tags: item.tags,
  };
};
const CONTENTFUL_LIST_FIELDS =
  "sys,fields.title,fields.digest,fields.thumbnail,fields.user,fields.tags";
const getContentful = async (
  params: Record<string, string>,
): Promise<BlogSummary[]> => {
  const pages = await getContentfulPages<ContentfulBlog, ContentfulUser>({
    content_type: "blog",
    include: "2",
    order: "-sys.createdAt",
    select: CONTENTFUL_LIST_FIELDS,
    ...params,
  });
  return pages.flatMap(normalizeContentful);
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
  const entries: BlogSummary[] = [];
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
  if (!UUID_PATTERN.test(id)) {
    const pages = await getContentfulPages<ContentfulBlog, ContentfulUser>({
      content_type: "blog",
      include: "2",
      "sys.id": id,
      limit: "1",
    });
    const page = pages[0];
    const item = page?.items[0];
    if (!item) return undefined;
    return {
      ...normalizeContentful(page)[0],
      body: () => Promise.resolve(item.fields.body ?? ""),
    };
  }
  try {
    const item = await toyboxRequest<ToyboxBlog>(
      `/blogs/${encodeURIComponent(id)}`,
    );
    return {
      ...normalizeToybox(item),
      body: () => Promise.resolve(item.body_text),
    };
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) return undefined;
    throw error;
  }
};
