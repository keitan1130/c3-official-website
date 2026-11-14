export type BodyLoader = () => Promise<string>;
export interface Author {
  id: string;
  name: string;
  introduction: string;
  avatar: string | null;
  links: Record<string, string>;
  source?: "contentful" | "toybox";
}
export interface Tag {
  id: string;
  name: string;
  color?: string;
}
export interface Entry {
  id: string;
  title: string;
  digest: string;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  authorIds: string[];
  tagIds: string[];
  isImportant: boolean;
  isPublished: boolean;
  body: BodyLoader;
}
export interface Community {
  id: string;
  slug: string;
  name: string;
  domain: string;
  webm: string;
  mp4: string;
  body: BodyLoader;
}
export interface FeaturedWork {
  id: string;
  title: string;
  thumbnail: string;
}
export interface ContentData {
  about: { id: string; title: string; summary: string; body: BodyLoader };
  communities: Community[];
  news: Entry[];
  authors: Author[];
  tags: Tag[];
  works: FeaturedWork[];
  site: {
    title: string;
    description: string;
    worksUrl: string;
    communities: string[];
    links: { title: string; url: string }[];
    logo: string;
    poster: string;
  };
}
