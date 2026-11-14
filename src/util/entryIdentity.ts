import type { BlogEntry, Entry } from "@/shared/types/content";

export const getEntryIdentity = (entry: Entry | BlogEntry): string =>
  `${"source" in entry ? entry.source : "news"}:${entry.id}`;
