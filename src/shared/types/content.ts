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
export interface EntrySummary {
  id: string;
  kind: "news" | "blog";
  title: string;
  digest: string;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  authors: AuthorReference[];
  tags: Tag[];
}
export interface Entry extends EntrySummary {
  body: BodyLoader;
}
export interface BlogSummary extends EntrySummary {
  kind: "blog";
  source: "contentful" | "toybox";
}
export interface BlogEntry extends BlogSummary {
  body: BodyLoader;
}
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
  news: Entry[];
}
export interface BlogListResult {
  entries: BlogSummary[];
  unavailableSources: string[];
}
