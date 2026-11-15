export const SITE = {
  title: "Composite Computer Club",
  shortName: "C3",
  description: "九州工業大学情報工学部のComposite Computer Club公式サイト",
  origin: "https://compositecomputer.club",
  logo: "/C3Logo.svg",
  defaultImage: "/ogp/site.png",
  themeColor: "#7db4d6",
  backgroundColor: "#f5f5f5",
} as const;

export const EXTERNAL_LINKS = {
  toybox: {
    url: "https://toybox.compositecomputer.club/",
    label: "Toybox",
  },
  x: {
    url: "https://x.com/c3_kyutech",
    label: "C3 X",
  },
  github: {
    url: "https://github.com/Kyutech-C3",
    label: "C3 GitHub",
  },
  youtube: {
    url: "https://www.youtube.com/channel/UCeRY2jujVBYRqmilrCZytFw",
    label: "C3 Youtubeチャンネル",
  },
} as const;
export const HEADER_LINK_ORDER = ["toybox", "x", "github", "youtube"] as const;
export const FOOTER_LINK_ORDER = ["toybox", "x", "youtube", "github"] as const;
export type ExternalLinkId = keyof typeof EXTERNAL_LINKS;

export const PAGES = {
  home: { path: "/", title: SITE.title, navigationLabel: "HOME" },
  about: { path: "/about", title: "C3について" },
  news: { path: "/news", title: "お知らせ" },
  blog: { path: "/blog", title: "ブログ" },
  notFound: { path: "/404", title: "404" },
} as const;

interface PageMetadataInput {
  title: string;
  pathname: string;
  description?: string;
  image?: string;
}
export const createPageMetadata = ({
  title,
  pathname,
  description = SITE.description,
  image,
}: PageMetadataInput) => ({
  title: `${title} | ${SITE.shortName}`,
  ogTitle: title,
  description,
  url: new URL(pathname, SITE.origin).href,
  image: new URL(image || SITE.defaultImage, SITE.origin).href,
});
