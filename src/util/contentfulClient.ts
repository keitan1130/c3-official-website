export interface ContentfulAsset {
  sys: { id: string };
  fields: { file?: { url?: string } };
}
export interface ContentfulCollection<T, TIncluded = T> {
  items: T[];
  total: number;
  includes?: { Asset?: ContentfulAsset[]; Entry?: TIncluded[] };
}
export const getContentfulPages = async <T, TIncluded = T>(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<ContentfulCollection<T, TIncluded>[]> => {
  const space = import.meta.env.VITE_CTF_SPACE_ID;
  const token = import.meta.env.VITE_CTF_CDA_ACCESS_TOKEN;
  if (!space || !token)
    throw new Error("Contentful delivery is not configured");
  const pages: ContentfulCollection<T, TIncluded>[] = [];
  let count = 0;
  let total = 0;
  do {
    const url = new URL(
      `https://cdn.contentful.com/spaces/${encodeURIComponent(space)}/environments/master/entries`,
    );
    for (const [key, value] of Object.entries({
      limit: "100",
      ...params,
      skip: String(count),
    }))
      url.searchParams.set(key, value);
    const response = await fetch(url, {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok)
      throw new Error(`Contentful delivery failed (${response.status})`);
    const data = (await response.json()) as ContentfulCollection<T, TIncluded>;
    if (
      !Array.isArray(data.items) ||
      !Number.isInteger(data.total) ||
      data.total < 0
    )
      throw new Error("Invalid Contentful response");
    total = data.total;
    if (!data.items.length && count < total)
      throw new Error("Contentful pagination ended early");
    pages.push(data);
    count += data.items.length;
  } while (count < total);
  return pages;
};
export const secureContentUrl = (url: string): string =>
  url.startsWith("//") ? `https:${url}` : url;
