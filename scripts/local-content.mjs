import fs from "node:fs";
import path from "node:path";
import { COMMUNITIES } from "../src/config/communities.ts";

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
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${label}: ${value}`);
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) throw new Error(`Invalid ${label}: ${value}`);
};
export function loadContent(root = path.resolve("content")) {
  const news = readEntries(root, "news");
  for (const { value: item, directory } of news) {
    requireId(item.id, "news id");
    for (const key of ["title", "digest", "body", "thumbnail"]) requireText(item[key], `${key}: ${item.id}`);
    requireDate(item.publishedDate, `publishedDate: ${item.id}`);
    if (!item.thumbnail.startsWith("./assets/") || !/\.(?:png|jpe?g|webp|gif|avif)$/i.test(item.thumbnail)) throw new Error(`Invalid thumbnail: ${item.id}`);
    const thumbnail = localFile(directory, item.thumbnail);
    if (!thumbnail.startsWith(path.resolve(directory, "assets") + path.sep)) throw new Error(`Invalid thumbnail: ${item.id}`);
    const body = fs.readFileSync(localFile(directory, item.body), "utf8");
    for (const relative of new Set(body.match(/\.\/assets\/[^\s<>"'()\]]+/g) ?? [])) localFile(directory, relative);
  }
  assertUnique(news.map(({ value }) => value.id), "news id");
  news.sort((a, b) => b.value.publishedDate.localeCompare(a.value.publishedDate) || a.value.id.localeCompare(b.value.id));
  const communityFiles = readEntries(root, "communities");
  if (communityFiles.length !== COMMUNITIES.length || communityFiles.some(({directory}) => !COMMUNITIES.some(({slug}) => slug === path.basename(directory)))) throw new Error("Invalid community definitions");
  const communities = COMMUNITIES.map((definition) => {
    const item = communityFiles.find(({directory}) => path.basename(directory) === definition.slug);
    for (const key of ["domain", "body", "mp4"]) requireText(item.value[key], `${key}: ${definition.slug}`);
    localFile(item.directory, item.value.body); localFile(item.directory, item.value.mp4);
    return { directory: item.directory, value: { ...item.value, ...definition } };
  });
  const about = { value: read(path.join(root, "about/index.json")), directory: path.join(root, "about") };
  requireText(about.value.summary, "about summary");
  localFile(about.directory, about.value.body);
  return { news, communities, about };
}
