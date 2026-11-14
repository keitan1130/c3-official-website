import fs from "node:fs";
import path from "node:path";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export const readEntries = (root, name) => fs.readdirSync(path.join(root, name), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const directory = path.join(root, name, entry.name);
    return { value: read(path.join(directory, "index.json")), directory };
  });
export function localFile(directory, relative) {
  if (typeof relative !== "string" || !relative.startsWith("./")) throw new Error(`Expected local reference: ${relative}`);
  const file = path.resolve(directory, relative);
  if (!file.startsWith(path.resolve(directory) + path.sep)) throw new Error(`Invalid local reference: ${relative}`);
  if (!fs.statSync(file).isFile()) throw new Error(`Expected file: ${file}`);
  if (fs.statSync(file).size > 25 * 1024 * 1024) throw new Error(`Pages asset exceeds 25 MiB: ${file}`);
  return file;
}
const requireText = (value, label) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${label}`);
};
const assertUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
};
const requireId = (value, label) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(value)) throw new Error(`Invalid ${label}: ${value}`);
};
const requireDate = (value, label) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${label}: ${value}`);
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) throw new Error(`Invalid ${label}: ${value}`);
};
export function loadContent(root = path.resolve("content")) {
  const site = read(path.join(root, "site/index.json"));
  const origin = new URL(process.env.SITE_URL || site.canonicalOrigin);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid canonical origin");
  site.canonicalOrigin = origin.origin;
  const tags = read(path.join(root, "tags.json"));
  if (!Array.isArray(tags)) throw new Error("Invalid tags");
  for (const tag of tags) { requireId(tag.id, "tag id"); requireText(tag.name, "tag name"); }
  assertUnique(tags.map((tag) => tag.id), "tag id");
  const tagIds = new Set(tags.map((tag) => tag.id));
  const news = readEntries(root, "news");
  for (const { value: item, directory } of news) {
    requireId(item.id, "news id");
    for (const key of ["title", "digest", "body", "thumbnail"]) requireText(item[key], `${key}: ${item.id}`);
    for (const key of ["createdAt", "updatedAt"]) requireDate(item[key], `${key}: ${item.id}`);
    if (Date.parse(item.updatedAt) < Date.parse(item.createdAt)) throw new Error(`updatedAt precedes createdAt: ${item.id}`);
    if (!Array.isArray(item.authorIds) || item.authorIds.some((id) => typeof id !== "string" || !id.trim())) throw new Error(`Invalid authorIds: ${item.id}`);
    if (!Array.isArray(item.tagIds) || item.tagIds.some((id) => !tagIds.has(id))) throw new Error(`Unknown tag: ${item.id}`);
    assertUnique(item.authorIds, `authorIds: ${item.id}`); assertUnique(item.tagIds, `tagIds: ${item.id}`);
    if (!item.thumbnail.startsWith("./assets/") || !/\.(?:png|jpe?g|webp|gif|avif)$/i.test(item.thumbnail)) throw new Error(`Invalid thumbnail: ${item.id}`);
    const thumbnail = localFile(directory, item.thumbnail);
    if (!thumbnail.startsWith(path.resolve(directory, "assets") + path.sep)) throw new Error(`Invalid thumbnail: ${item.id}`);
    const body = fs.readFileSync(localFile(directory, item.body), "utf8");
    for (const relative of new Set(body.match(/\.\/assets\/[^\s<>"'()\]]+/g) ?? [])) localFile(directory, relative);
  }
  assertUnique(news.map(({ value }) => value.id), "news id");
  news.sort((a, b) => Date.parse(b.value.createdAt) - Date.parse(a.value.createdAt) || a.value.id.localeCompare(b.value.id));
  const communities = readEntries(root, "communities");
  for (const { value } of communities) requireId(value.slug, "community slug");
  assertUnique(communities.map(({ value }) => value.slug), "community slug");
  if (!Array.isArray(site.communities) || site.communities.length !== communities.length || new Set(site.communities).size !== site.communities.length || site.communities.some((slug) => !communities.some(({ value }) => value.slug === slug))) throw new Error("Invalid community order");
  communities.sort((a, b) => site.communities.indexOf(a.value.slug) - site.communities.indexOf(b.value.slug));
  return { site, tags, news, communities, about: { value: read(path.join(root, "about/index.json")), directory: path.join(root, "about") } };
}
