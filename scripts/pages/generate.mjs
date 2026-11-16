import { createPageMetadata } from "../../src/util/pageMetadata.ts";
import { assetFile, loadContent } from "../content/load.mjs";
import { loadSiteEnvironment, PAGE_TITLES, SITE } from "../lib/environment.mjs";

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
export function preparePages(
  root = process.cwd(),
  output = path.join(root, "dist"),
) {
  const { about, communities, news } = loadContent(path.join(root, "content"));
  const origin = SITE.origin;
  const template = fs.readFileSync(path.join(output, "index.html"), "utf8");
  const escapeHtml = (text) =>
    String(text).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const metadata = (title, description, url, image, isError = false) => {
    const meta = createPageMetadata({
      title,
      description,
      pathname: url,
      image,
    });
    return template
      .replace(
        /<title>[^<]*<\/title>/,
        `<title>${escapeHtml(meta.title)}</title>`,
      )
      .replace(/<meta name="description"[^>]*\/?\s*>/g, "")
      .replace(
        "</head>",
        `<meta name="description" content="${escapeHtml(meta.description)}"><meta property="og:title" content="${escapeHtml(meta.ogTitle)}"><meta property="og:description" content="${escapeHtml(meta.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${escapeHtml(meta.url)}"><meta property="og:image" content="${escapeHtml(meta.image)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${escapeHtml(meta.url)}">${isError ? '<meta name="robots" content="noindex">' : ""}</head>`,
      );
  };
  const routes = [];
  function emit(route, title, description, image) {
    const file =
      route === "/"
        ? path.join(output, "index.html")
        : path.join(output, `${route.slice(1)}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, metadata(title, description, origin + route, image));
    routes.push(route);
  }
  fs.mkdirSync(path.dirname(output + SITE.defaultImage), { recursive: true });
  fs.copyFileSync(
    path.join(root, "public/favicon.png"),
    output + SITE.defaultImage,
  );
  emit("/", SITE.title, SITE.description);
  emit("/about", PAGE_TITLES.about, about.value.summary);
  emit("/news", PAGE_TITLES.news, SITE.description);
  emit("/blog", PAGE_TITLES.blog, SITE.description);
  for (const { value: item } of communities)
    emit(`/community/${item.slug}`, item.name, item.domain);
  for (const { value: item, directory } of news) {
    const source = assetFile(directory, item.thumbnail);
    const image = `/ogp/news/${item.id}${path.extname(source)}`;
    fs.mkdirSync(path.join(output, "ogp/news"), { recursive: true });
    fs.copyFileSync(source, output + image);
    emit(`/news/${item.id}`, item.title, item.digest, image);
  }
  fs.writeFileSync(
    path.join(output, "404.html"),
    metadata(
      "404",
      "ページが見つかりません。",
      `${origin}/404`,
      undefined,
      true,
    ),
  );
  fs.writeFileSync(
    path.join(output, "_redirects"),
    "/blog/* /index.html 200\n/author/* /index.html 200\n",
  );
  fs.writeFileSync(
    path.join(output, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
  );
  fs.writeFileSync(
    path.join(output, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${escapeHtml(origin + route)}</loc></url>`).join("")}</urlset>\n`,
  );
  console.log(
    `Prepared ${routes.length} route HTML documents, initial OGP, 404, sitemap and Pages dynamic-route fallbacks.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  loadSiteEnvironment();
  preparePages();
}
