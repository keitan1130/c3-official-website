// Home and Header follow this order. About has its own intentional link order.
export const COMMUNITIES = [
  { slug: "2dcg", name: "2DCG" },
  { slug: "3dcg", name: "3DCG" },
  { slug: "game", name: "GAME" },
  { slug: "hack", name: "HACK" },
  { slug: "music", name: "MUSIC" },
] as const;
export type CommunitySlug = (typeof COMMUNITIES)[number]["slug"];
export const ABOUT_COMMUNITY_ORDER: readonly CommunitySlug[] = [
  "game",
  "3dcg",
  "hack",
  "2dcg",
  "music",
];
