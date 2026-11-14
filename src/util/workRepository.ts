import type { FeaturedWork } from "@/shared/types/content";

export const WORKS_API_BASE_URL = import.meta.env.VITE_WORKS_API_BASE_URL;
export const WORKS_LIMIT = 20;

interface PublicWork {
  id: string;
  title: string;
  thumbnail_url: string;
  visibility: string;
}

const isPublicWork = (value: unknown): value is PublicWork => {
  if (!value || typeof value !== "object") return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "thumbnail_url" in value &&
    typeof value.thumbnail_url === "string" &&
    "visibility" in value &&
    value.visibility === "public"
  );
};

export const getPublicWorks = async (): Promise<FeaturedWork[]> => {
  if (!WORKS_API_BASE_URL)
    throw new Error("作品APIの接続先が設定されていません。");
  const url = new URL(`${WORKS_API_BASE_URL.replace(/\/$/, "")}/works`);
  url.search = new URLSearchParams({
    limit: String(WORKS_LIMIT),
    page: "1",
    sort: "newest",
    visibility: "public",
  }).toString();
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok)
    throw new Error(`作品を読み込めませんでした。（${response.status}）`);
  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    !("works" in data) ||
    !Array.isArray(data.works)
  ) {
    throw new Error("作品APIの応答形式が正しくありません。");
  }
  return data.works
    .filter(isPublicWork)
    .slice(0, WORKS_LIMIT)
    .map((work) => ({
      id: work.id,
      title: work.title,
      thumbnail: work.thumbnail_url,
    }));
};
