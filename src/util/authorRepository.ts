import type { Author } from "@/shared/types/content";

interface ContentfulUser {
  sys: { id: string };
  fields: {
    name?: string;
    introduction?: string;
    icon?: { sys: { id: string } };
    twitter?: string;
    qiita?: string;
    gitHub?: string;
    zenn?: string;
    homePage?: string;
  };
}
interface ContentfulUserCollection {
  items: ContentfulUser[];
  total: number;
  includes?: {
    Asset?: { sys: { id: string }; fields: { file?: { url?: string } } }[];
  };
}

const getPage = async (
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<ContentfulUserCollection> => {
  const space = import.meta.env.VITE_CTF_SPACE_ID;
  const token = import.meta.env.VITE_CTF_CDA_ACCESS_TOKEN;
  if (!space || !token)
    throw new Error("Contentful author delivery is not configured");
  const url = new URL(
    `https://cdn.contentful.com/spaces/${encodeURIComponent(space)}/environments/master/entries`,
  );
  for (const [key, value] of Object.entries({
    content_type: "user",
    include: "1",
    limit: "100",
    ...params,
  }))
    url.searchParams.set(key, value);
  const response = await fetch(url, {
    signal,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error(`Author delivery failed (${response.status})`);
  const data = (await response.json()) as ContentfulUserCollection;
  if (!Array.isArray(data.items) || typeof data.total !== "number")
    throw new Error("Invalid author delivery response");
  return data;
};
const normalizeAuthors = (page: ContentfulUserCollection): Author[] =>
  page.items.map(({ sys, fields }) => {
    const asset = page.includes?.Asset?.find(
      (item) => item.sys.id === fields.icon?.sys.id,
    );
    const avatar = asset?.fields.file?.url;
    const links: Record<string, string> = {};
    for (const key of [
      "twitter",
      "qiita",
      "gitHub",
      "zenn",
      "homePage",
    ] as const) {
      const value = fields[key];
      if (value && /^https?:\/\/[^/]+\/.+/.test(value)) links[key] = value;
    }
    return {
      id: sys.id,
      name: fields.name ?? "",
      introduction: fields.introduction ?? "",
      avatar: avatar
        ? avatar.startsWith("//")
          ? `https:${avatar}`
          : avatar
        : null,
      links,
      source: "contentful",
    };
  });
export const getAuthor = async (
  id: string,
  signal?: AbortSignal,
): Promise<Author | undefined> =>
  normalizeAuthors(await getPage({ "sys.id": id }, signal))[0];
export const getAuthors = async (signal?: AbortSignal): Promise<Author[]> => {
  const authors: Author[] = [];
  let total = 0;
  do {
    const page = await getPage({ skip: String(authors.length) }, signal);
    total = page.total;
    if (!page.items.length && authors.length < total)
      throw new Error("Author pagination ended early");
    authors.push(...normalizeAuthors(page));
  } while (authors.length < total);
  return authors;
};
