import { COMMUNITIES } from "../../src/config/communities.ts";
import { markdownAssetEdits } from "./markdownAssets.ts";

import fs from "node:fs";
import path from "node:path";

interface ContentEntry<T> {
  value: T;
  directory: string;
}
interface NewsInput {
  id: string;
  title: string;
  digest: string;
  body: string;
  thumbnail: string;
  publishedDate: string;
}

const read = (file: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`Expected content object: ${file}`);
  return value as Record<string, unknown>;
};
export const readEntries = (root: string, name: string) =>
  fs
    .readdirSync(path.join(root, name), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(root, name, entry.name);
      return { value: read(path.join(directory, "index.json")), directory };
    });
export function localFile(
  directory: string,
  relative: unknown,
  boundary = directory,
) {
  if (
    typeof relative !== "string" ||
    !relative ||
    /^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(relative) ||
    relative.includes("\\")
  )
    throw new Error(`Expected local reference: ${relative}`);
  const file = path.resolve(directory, relative);
  if (!file.startsWith(path.resolve(boundary) + path.sep))
    throw new Error(`Invalid local reference: ${relative}`);
  if (!fs.realpathSync(file).startsWith(fs.realpathSync(boundary) + path.sep))
    throw new Error(`Invalid local reference: ${relative}`);
  if (!fs.statSync(file).isFile()) throw new Error(`Expected file: ${file}`);
  if (fs.statSync(file).size > 25 * 1024 * 1024)
    throw new Error(`Pages asset exceeds 25 MiB: ${file}`);
  return file;
}
export function assetFile(
  entryDirectory: string,
  relative: unknown,
  directory = entryDirectory,
) {
  localFile(directory, relative, entryDirectory);
  return localFile(directory, relative, path.join(entryDirectory, "assets"));
}
export function localAsset(
  directory: string,
  url: string,
  entryDirectory = directory,
  kind: "media" | "link" = "media",
) {
  if (!url || /^(?:[a-z][a-z\d+.-]*:|[\\/#?])/i.test(url)) return;
  const index = url.search(/[?#]/);
  const pathname = index < 0 ? url : url.slice(0, index);
  const suffix = index < 0 ? "" : url.slice(index);
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (error) {
    if (kind === "link" && !/^(?:\.{1,2}\/)*assets\//.test(pathname)) return;
    throw error;
  }
  if (kind === "link" && !/^(?:\.{1,2}\/)*assets\//.test(decoded)) return;
  return { file: assetFile(entryDirectory, decoded, directory), suffix };
}
const validateBody = (directory: string, relative: unknown) => {
  const file = localFile(directory, relative);
  const text = fs.readFileSync(file, "utf8");
  markdownAssetEdits(text, (url, _context, kind) => {
    localAsset(path.dirname(file), url, directory, kind);
    return url;
  });
};
function requireText(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`Missing ${label}`);
}
function requireFields<K extends string>(
  value: Record<string, unknown>,
  keys: readonly K[],
  label: string,
): asserts value is Record<string, unknown> & Record<K, string> {
  for (const key of keys) requireText(value[key], `${key}: ${label}`);
}
const assertUnique = (values: readonly string[], label: string) => {
  if (new Set(values).size !== values.length)
    throw new Error(`Duplicate ${label}`);
};
function requireId(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(value)
  )
    throw new Error(`Invalid ${label}: ${value}`);
}
function requireDate(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error(`Invalid ${label}: ${value}`);
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate()
  )
    throw new Error(`Invalid ${label}: ${value}`);
}
export function loadContent(root = path.resolve("content")) {
  const news: ContentEntry<NewsInput>[] = readEntries(root, "news").map(
    ({ value: item, directory }) => {
      requireId(item.id, "news id");
      requireFields(item, ["title", "digest", "body", "thumbnail"], item.id);
      requireDate(item.publishedDate, `publishedDate: ${item.id}`);
      if (!/\.(?:png|jpe?g|webp|gif|avif)$/i.test(item.thumbnail))
        throw new Error(`Invalid thumbnail: ${item.id}`);
      assetFile(directory, item.thumbnail);
      validateBody(directory, item.body);
      return {
        directory,
        value: { ...item, id: item.id, publishedDate: item.publishedDate },
      };
    },
  );
  assertUnique(
    news.map(({ value }) => value.id),
    "news id",
  );
  news.sort(
    (a, b) =>
      b.value.publishedDate.localeCompare(a.value.publishedDate) ||
      a.value.id.localeCompare(b.value.id),
  );
  const communityFiles = readEntries(root, "communities");
  if (
    communityFiles.length !== COMMUNITIES.length ||
    communityFiles.some(
      ({ directory }) =>
        !COMMUNITIES.some(({ slug }) => slug === path.basename(directory)),
    )
  )
    throw new Error("Invalid community definitions");
  const communities = COMMUNITIES.map((definition) => {
    const item = communityFiles.find(
      ({ directory }) => path.basename(directory) === definition.slug,
    );
    if (!item) throw new Error("Invalid community definitions");
    requireFields(item.value, ["domain", "body", "mp4"], definition.slug);
    validateBody(item.directory, item.value.body);
    assetFile(item.directory, item.value.mp4);
    return {
      directory: item.directory,
      value: { ...item.value, ...definition },
    };
  });
  const aboutValue = read(path.join(root, "about/index.json"));
  requireFields(aboutValue, ["summary", "body"], "about");
  const about = { value: aboutValue, directory: path.join(root, "about") };
  validateBody(about.directory, about.value.body);
  return { news, communities, about };
}
