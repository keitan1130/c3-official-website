import {
  type ContentfulCollection,
  getContentfulPages,
  secureContentUrl,
} from "@/util/contentfulClient";

import type { Author } from "@/shared/types/content";

export interface ContentfulUser {
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
type ContentfulUserCollection = ContentfulCollection<ContentfulUser>;

export const normalizeContentfulAuthors = (
  page: Pick<ContentfulUserCollection, "items" | "includes">,
): Author[] =>
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
      avatar: avatar ? secureContentUrl(avatar) : null,
      links,
      source: "contentful",
    };
  });
export const getAuthors = async (signal?: AbortSignal): Promise<Author[]> => {
  const pages = await getContentfulPages<ContentfulUser>(
    { content_type: "user", include: "1" },
    signal,
  );
  return pages.flatMap(normalizeContentfulAuthors);
};
