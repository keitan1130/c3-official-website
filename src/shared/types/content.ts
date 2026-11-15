import type { CommunitySlug } from "@/config/communities";
export type BodyLoader = () => Promise<string>;
export interface Author {
  id: string;
  name: string;
  introduction: string;
  avatar: string | null;
  links: Record<string, string>;
  source?: "contentful" | "toybox";
}
export interface AuthorReference {
  id: string;
  profile?: Author;
}
export interface Tag {
  id: string;
  name: string;
}
interface EntrySummaryBase {
  id: string;
  title: string;
  digest: string;
  thumbnail: string;
}
export interface NewsSummary extends EntrySummaryBase {
  kind: "news";
  publishedDate: string;
}
export interface NewsEntry extends NewsSummary {
  body: BodyLoader;
}
export interface BlogSummary extends EntrySummaryBase {
  kind: "blog";
  createdAt: string;
  updatedAt: string;
  authors: AuthorReference[];
  tags: Tag[];
  source: "contentful" | "toybox";
}
export interface BlogEntry extends BlogSummary {
  body: BodyLoader;
}
export type EntrySummary = NewsSummary | BlogSummary;
export type Entry = NewsEntry | BlogEntry;
export interface Community {
  slug: CommunitySlug;
  name: string;
  domain: string;
  mp4: string;
  body: BodyLoader;
}
export interface FeaturedWork {
  id: string;
  title: string;
  thumbnail: string;
}
export interface ContentData {
  about: { summary: string; body: BodyLoader };
  communities: Community[];
  news: NewsEntry[];
}
export interface BlogListResult {
  entries: BlogSummary[];
  unavailableSources: string[];
}
