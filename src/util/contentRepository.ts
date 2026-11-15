import CONTENT_DATA from "@/generated/contentData";

import type { ContentData } from "@/shared/types/content";

export const CONTENT: ContentData = CONTENT_DATA;
export const getNews = (id: string) =>
  CONTENT.news.find((entry) => entry.id === id);
export const getCommunity = (slug: string) =>
  CONTENT.communities.find((community) => community.slug === slug);
