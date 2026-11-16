import { loadSiteEnvironment, SITE } from "../../scripts/lib/environment.ts";
import { COMMUNITIES } from "../../src/config/communities.ts";

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

loadSiteEnvironment();
const root = "dist";
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => new URL(match[1]),
);
for (const url of urls) {
  assert.equal(url.origin, SITE.origin);
  const file =
    url.pathname === "/"
      ? "dist/index.html"
      : path.join(root, `${url.pathname.slice(1)}.html`);
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<meta property="og:title" content="[^"]+"/);
  assert.match(html, /<link rel="canonical"/);
  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  assert.ok(imageMatch);
  const image = new URL(imageMatch[1]);
  assert.equal(image.origin, SITE.origin);
  assert.ok(fs.existsSync(path.join(root, image.pathname)));
  assert.ok(html.includes(`<meta property="og:url" content="${url.href}">`));
  assert.ok(html.includes(`<link rel="canonical" href="${url.href}">`));
}
const readEntries = (directory: string) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      JSON.parse(
        fs.readFileSync(path.join(directory, entry.name, "index.json"), "utf8"),
      ),
    );
const expected = [
  "/",
  "/about",
  "/news",
  "/blog",
  ...COMMUNITIES.map((entry) => `/community/${entry.slug}`),
  ...readEntries("content/news").map((entry) => `/news/${entry.id}`),
];
assert.deepEqual(urls.map((url) => url.pathname).sort(), expected.sort());
assert.ok(!sitemap.includes("/contact"));
assert.ok(!sitemap.includes("5Ay58j7CHdYFqKShRbr5tD"));
assert.match(fs.readFileSync("dist/404.html", "utf8"), /noindex/);
console.log(
  `Verified ${urls.length} static HTML metadata documents, local OGP images and removed-route exclusions. Dynamic author/blog initial OGP is pending.`,
);
