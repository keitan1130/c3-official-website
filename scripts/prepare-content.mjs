import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve("content");
const OUTPUT = path.resolve("src/generated/contentData.ts");
const READ = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const childEntries = (directory) => fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(directory, entry.name, "index.json")).filter((file) => fs.existsSync(file));

export function prepareContent(root = ROOT, output = OUTPUT) {
  const imports = new Map();
  const assetReference = (directory, relative) => {
    const file = path.resolve(directory, relative);
    if (!file.startsWith(`${path.resolve(directory)}${path.sep}`) || !fs.statSync(file).isFile()) throw new Error(`Invalid local reference: ${file}`);
    if (fs.statSync(file).size > 25 * 1024 * 1024) throw new Error(`Pages asset exceeds 25 MiB: ${file}`);
    if (!imports.has(file)) imports.set(file, `ASSET_${imports.size}`);
    return imports.get(file);
  };
  const serialize = (value, directory, key = "") => {
    if (key === "body") {
      const file = path.resolve(directory, value);
      if (!file.startsWith(`${directory}${path.sep}`)) throw new Error(`Invalid body: ${file}`);
      const text = fs.readFileSync(file, "utf8");
      const matches = [...new Set(text.match(/\.\/assets\/[^\s<>"'()\]]+/g) ?? [])];
      const replacements = matches.map((relative) => `.replaceAll(${JSON.stringify(relative)}, ${assetReference(directory, relative)})`).join("");
      const importPath = path.relative(path.dirname(output), file).split(path.sep).join("/");
      return `() => import(${JSON.stringify(importPath + "?raw")}).then(module => module.default${replacements})`;
    }
    if (typeof value === "string" && value.startsWith("./assets/")) return assetReference(directory, value);
    if (Array.isArray(value)) return `[${value.map((item) => serialize(item, directory)).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.entries(value).map(([name, item]) => `${JSON.stringify(name)}:${serialize(item, directory, name)}`).join(",")}}`;
    return JSON.stringify(value);
  };
  const collect = (name) => childEntries(path.join(root, name)).map((file) => ({ value: READ(file), directory: path.dirname(file) }));
  const authors = collect("authors");
  const tags = READ(path.join(root, "tags.json"));
  const allNews = collect("news");
  const communities = collect("communities");
  const assertUnique = (items, field, label) => {
    const values = items.map((item) => item.value[field]);
    if (values.some((value) => typeof value !== "string" || !value.trim()) || new Set(values).size !== values.length) throw new Error(`Missing or duplicate ${label}`);
  };
  assertUnique(authors, "id", "author id"); assertUnique(allNews, "id", "news id"); assertUnique(communities, "slug", "community slug");
  const authorIds = new Set(authors.map(({value}) => value.id));
  const tagIds = new Set(tags.map((tag) => tag.id));
  const news = allNews.filter(({value}) => value.isPublished === true);
  for (const {value: item} of news) {
    for (const key of ["title", "id", "body", "thumbnail"]) if (typeof item[key] !== "string" || !item[key]) throw new Error(`Missing ${key}: ${item.id}`);
    for (const key of ["createdAt", "updatedAt"]) if (!Number.isFinite(Date.parse(item[key]))) throw new Error(`Invalid ${key}: ${item.id}`);
    if (!Array.isArray(item.authorIds) || item.authorIds.some((id) => !authorIds.has(id))) throw new Error(`Unknown author: ${item.id}`);
    if (!Array.isArray(item.tagIds) || item.tagIds.some((id) => !tagIds.has(id))) throw new Error(`Unknown tag: ${item.id}`);
  }
  news.sort((a,b) => b.value.createdAt.localeCompare(a.value.createdAt) || a.value.id.localeCompare(b.value.id));
  const site = READ(path.join(root, "site/index.json"));
  if (new Set(site.communities).size !== site.communities.length || site.communities.some((slug) => !communities.some(({value}) => value.slug === slug))) throw new Error("Invalid community order");
  communities.sort((a,b) => site.communities.indexOf(a.value.slug)-site.communities.indexOf(b.value.slug));
  const workOrder = READ(path.join(root,"featured-works/index.json")).items;
  if (new Set(workOrder).size !== workOrder.length) throw new Error("Duplicate featured work slug");
  const works = workOrder.map((slug) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid work slug");
    const directory = path.join(root,"featured-works",slug); return {value:READ(path.join(directory,"index.json")), directory};
  });
  const render = (items) => `[${items.map(({value,directory}) => serialize(value,directory)).join(",")}]`;
  site.logo = "./assets/s_logo.webp"; site.poster = "./assets/loading.webp";
  const body = `{about:${serialize(READ(path.join(root,"about/index.json")),path.join(root,"about"))},site:${serialize(site,path.join(root,"site"))},communities:${render(communities)},news:${render(news)},authors:${render(authors)},tags:${JSON.stringify(tags)},works:${render(works)}}`;
  const preamble = [...imports].map(([file,name]) => `import ${name} from ${JSON.stringify(path.relative(path.dirname(output),file).split(path.sep).join("/")+"?url")};`).join("\n");
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output, `// Generated by scripts/prepare-content.mjs. Edit content/ instead.\n${preamble}\nimport type { ContentData } from "@/shared/types/content";\nconst CONTENT_DATA: ContentData = ${body};\nexport default CONTENT_DATA;\n`);
  return {news:news.length,authors:authors.length,communities:communities.length,works:works.length,assets:imports.size};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(prepareContent());
