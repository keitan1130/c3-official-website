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
export type ExternalLinkId = keyof typeof EXTERNAL_LINKS;

export const PAGE_TITLES = {
  about: "C3について",
  news: "お知らせ",
  blog: "ブログ",
} as const;
