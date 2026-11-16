import { loadSiteEnvironment } from "../../scripts/lib/environment.mjs";
// Run against Vite with fixture environment settings; all API traffic is intercepted.

import { chromium } from "playwright";

import { loadContent } from "../../scripts/content/load.mjs";
import { EXTERNAL_LINKS, SITE } from "../../src/config/site.ts";
import { createPageMetadata } from "../../src/util/pageMetadata.ts";

import assert from "node:assert/strict";

loadSiteEnvironment("development");

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const thumbnail =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="gray"/></svg>',
  );
const uuid = (index) =>
  `fac206ed-32a0-4fdb-b3e8-${String(index).padStart(12, "0")}`;
const toyboxBlogs = Array.from({ length: 45 }, (_, index) => ({
  id: uuid(index),
  title: `Toybox ${index}`,
  body_text: "## Fixture body\n\nAvailable",
  created_at: new Date(Date.UTC(2026, 0, 1) - index * 86400000).toISOString(),
  updated_at: "2026-01-01T00:00:00Z",
  thumbnail: { url: thumbnail },
  tags: [],
  user: { id: uuid(1000 + index), name: "Fixture author" },
}));
const authorIds = Array.from({ length: 105 }, (_, index) => `author${index}`);
const contentfulAuthors = authorIds.map((id, index) => ({
  sys: { id },
  fields: {
    name: id === "author1" ? "Fixture profile" : `Fixture author ${index}`,
    icon: { sys: { id: "avatar" } },
    introduction: "Fixture introduction",
    homePage: id === "author1" ? "https://example.com/" : undefined,
  },
}));
const authorAssets = [
  { sys: { id: "avatar" }, fields: { file: { url: thumbnail } } },
];
let omitIncludedAuthors = false;
const contentfulBlogs = Array.from({ length: 105 }, (_, index) => ({
  sys: {
    id: `cf${index}`,
    createdAt: new Date(Date.UTC(2026, 0, 2) - index * 86400000).toISOString(),
    updatedAt: "2026-01-02T00:00:00Z",
  },
  fields: {
    title: `Contentful ${index}`,
    body: "## Fixture body",
    digest: "Summary",
    user: [{ sys: { id: `author${index}` } }],
    tags: index === 0 ? [{ sys: { id: "tag1" } }] : [],
  },
}));
let isContentfulUnavailable = false,
  isToyboxUnavailable = false;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [],
    requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /same key/.test(message.text()))
      errors.push(message.text());
  });
  await page.route(/cdn\.contentful\.com/, (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (isContentfulUnavailable)
      return route.fulfill({ status: 503, json: {} });
    if (url.searchParams.get("content_type") === "user") {
      const id = url.searchParams.get("sys.id"),
        skip = Number(url.searchParams.get("skip") ?? 0),
        limit = Number(url.searchParams.get("limit") ?? 100);
      const authors = id
        ? contentfulAuthors.filter((author) => author.sys.id === id)
        : contentfulAuthors;
      return route.fulfill({
        json: {
          items: authors.slice(skip, skip + limit),
          total: authors.length,
          includes: { Asset: authorAssets },
        },
      });
    }
    const id = url.searchParams.get("sys.id"),
      skip = Number(url.searchParams.get("skip") ?? 0),
      limit = Number(url.searchParams.get("limit") ?? 100);
    const found = id
      ? contentfulBlogs.filter((item) => item.sys.id === id)
      : contentfulBlogs;
    const items = found
      .slice(skip, skip + limit)
      .map((item) =>
        url.searchParams.has("select")
          ? { ...item, fields: { ...item.fields, body: undefined } }
          : item,
      );
    return route.fulfill({
      json: {
        items,
        total: found.length,
        includes: {
          Entry: [
            ...(omitIncludedAuthors ? [] : contentfulAuthors),
            { sys: { id: "tag1" }, fields: { name: "Fixture tag" } },
          ],
          Asset: authorAssets,
        },
      },
    });
  });
  await page.route("**/api/v1/blogs**", (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (isToyboxUnavailable) return route.fulfill({ status: 503, json: {} });
    if (url.pathname.endsWith("/blogs")) {
      assert.equal(url.searchParams.get("disable_pagination"), "true");
      assert.equal(url.searchParams.has("page"), false);
      return route.fulfill({
        json: { blogs: toyboxBlogs, blogs_total_count: toyboxBlogs.length },
      });
    }
    const blog = toyboxBlogs.find(
      (item) => item.id === url.pathname.split("/").at(-1),
    );
    return blog
      ? route.fulfill({ json: blog })
      : route.fulfill({ status: 404, json: {} });
  });
  await page.route(/\/works(?:\?|$)/, (route) =>
    route.fulfill({ json: { works: [] } }),
  );
  for (const [id, title] of [
    ["cf0", "Contentful 0"],
    [uuid(0), "Toybox 0"],
  ]) {
    requests.length = 0;
    await page.goto(`${BASE}/blog/${id}`);
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page
      .getByRole("heading", { name: "Fixture body", exact: true })
      .waitFor();
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    assert.ok(canonical.endsWith(`/blog/${id}`));
    assert.equal(new URL(canonical).origin, SITE.origin);
    assert.equal(await page.locator('a[href*="source="]').count(), 0);
    const article = await page.getByRole("article").boundingBox(),
      recent = await page.getByRole("complementary").boundingBox();
    assert.ok(recent.y >= article.y + article.height);
    if (id.startsWith("cf")) {
      assert.ok(!requests.some((url) => url.pathname.endsWith(`/blogs/${id}`)));
      assert.equal(
        requests.filter(
          (url) => url.searchParams.get("content_type") === "user",
        ).length,
        0,
      );
      assert.equal(
        await page
          .getByRole("link", {
            name: "Fixture author 0のユーザーページを開く",
            exact: true,
          })
          .count(),
        1,
      );
    } else {
      assert.ok(!requests.some((url) => url.searchParams.get("sys.id") === id));
      assert.equal(
        requests.filter(
          (url) => url.searchParams.get("content_type") === "user",
        ).length,
        0,
      );
      const authorLink = page.getByRole("link", {
        name: "Fixture authorのユーザーページを開く",
        exact: true,
      });
      assert.equal(
        await authorLink.getAttribute("href"),
        `${EXTERNAL_LINKS.toybox.url}users/${uuid(1000)}`,
      );
      assert.equal(await authorLink.getAttribute("target"), "_blank");
      assert.equal(
        await page.locator(`a[href="/author/${uuid(1000)}"]`).count(),
        0,
      );
    }
  }
  requests.length = 0;
  await page.goto(`${BASE}/blog`);
  await page.waitForFunction(
    () => document.querySelectorAll("article").length === 150,
  );
  assert.equal(
    requests.filter((url) => url.searchParams.get("content_type") === "user")
      .length,
    0,
  );
  assert.equal(await page.locator('article a[href^="/author/"]').count(), 105);
  assert.equal(
    await page
      .getByRole("link", {
        name: "Fixture authorのユーザーページを開く",
        exact: true,
      })
      .count(),
    45,
  );
  assert.equal(
    await page.getByRole("button", { name: "もっと見る", exact: true }).count(),
    0,
  );
  assert.ok(
    requests
      .filter(
        (url) =>
          url.searchParams.get("content_type") === "blog" &&
          !url.searchParams.has("sys.id"),
      )
      .every(
        (url) =>
          url.searchParams.get("select") &&
          !url.searchParams.get("select").includes("fields.body"),
      ),
  );
  await page.getByRole("link", { name: "Fixture tag", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll("article").length === 1,
  );
  await page
    .getByRole("heading", { name: "Contentful 0", exact: true })
    .waitFor();
  // Missing included authors and author pages share one paginated collection.
  omitIncludedAuthors = true;
  requests.length = 0;
  await page.goto(`${BASE}/blog`);
  await page
    .getByRole("link", {
      name: "Fixture author 104のユーザーページを開く",
      exact: true,
    })
    .waitFor();
  const authorRequests = () =>
    requests.filter((url) => url.searchParams.get("content_type") === "user");
  assert.equal(
    authorRequests().length,
    Math.ceil(contentfulAuthors.length / 100),
  );
  assert.ok(authorRequests().every((url) => !url.searchParams.has("sys.id")));
  await page
    .getByRole("button", { name: "メニューを開く", exact: true })
    .click();
  await page.getByRole("link", { name: "お知らせ", exact: true }).click();
  await page
    .getByRole("heading", { name: "お知らせ", exact: true, level: 1 })
    .waitFor();
  assert.equal(await page.locator('article a[href^="/author/"]').count(), 0);
  assert.equal(
    await page
      .getByRole("link", { name: "著者のユーザーページを開く", exact: true })
      .count(),
    0,
  );
  assert.equal(
    authorRequests().length,
    Math.ceil(contentfulAuthors.length / 100),
  );
  assert.equal(await page.locator('a[href*="/news?tag="]').count(), 0);
  const newsCount = loadContent().news.length;
  assert.equal(await page.getByRole("article").count(), newsCount);
  const news = loadContent().news[0].value;
  await page.getByRole("link", { name: news.title, exact: true }).click();
  await page
    .getByRole("article")
    .getByRole("heading", { name: news.title, exact: true, level: 1 })
    .waitFor();
  assert.equal(
    await page
      .getByText(`投稿日：${news.publishedDate.replaceAll("-", "/")}`, {
        exact: true,
      })
      .count(),
    1,
  );
  assert.equal(await page.getByText(/ユーザー：|更新日：|作成日：/).count(), 0);
  assert.equal(
    authorRequests().length,
    Math.ceil(contentfulAuthors.length / 100),
  );
  await page.goto(`${BASE}/blog`);
  {
    const link = page.locator('article a[href="/author/author1"]').first();
    await page
      .getByRole("link", {
        name: "Fixture profileのユーザーページを開く",
        exact: true,
      })
      .waitFor();
    const before = authorRequests().length;
    await link.click();
    await page
      .getByRole("heading", { name: "Fixture profile", exact: true, level: 1 })
      .waitFor();
    assert.equal(authorRequests().length, before);
    assert.equal(
      await page
        .getByRole("link", { name: "Webサイト", exact: true })
        .getAttribute("href"),
      "https://example.com/",
    );
  }
  omitIncludedAuthors = false;
  await page.goto(`${BASE}/author/author1`);
  await page.waitForFunction(
    () => document.querySelectorAll("article").length === 105,
  );
  requests.length = 0;
  await page.goto(`${BASE}/`);
  await page.getByRole("region", { name: "最新のブログ" }).waitFor();
  assert.equal(
    await page
      .getByRole("region", { name: "最新のブログ" })
      .getByRole("button", { name: /のスライド[0-9]+を表示/ })
      .count(),
    5,
  );
  assert.ok(requests.some((url) => url.searchParams.get("skip") === "100"));
  assert.equal(
    await page.title(),
    createPageMetadata({ title: SITE.title, pathname: "/" }).title,
  );
  assert.deepEqual(
    await page
      .locator("footer nav a")
      .evaluateAll((links) => links.map((link) => link.href)),
    ["toybox", "x", "youtube", "github"].map((id) => EXTERNAL_LINKS[id].url),
  );
  await page
    .getByRole("button", { name: "メニューを開く", exact: true })
    .click();
  for (const id of ["toybox", "x", "github", "youtube"])
    assert.equal(
      await page
        .getByRole("navigation", { name: "メインメニュー" })
        .getByRole("link", { name: EXTERNAL_LINKS[id].label, exact: true })
        .getAttribute("href"),
      EXTERNAL_LINKS[id].url,
    );
  await page.keyboard.press("Escape");
  const checks = await page.evaluate(
    async ({ existing, missing }) => {
      const { getBlog, getBlogs } = await import("/src/util/blogRepository.ts");
      const found = await getBlog(existing);
      const list = await getBlogs();
      if (list.entries.some((entry) => "body" in entry))
        throw new Error("List entries must not contain a body loader");
      return {
        source: found?.source,
        missing: (await getBlog(missing)) === undefined,
        contentfulMissing: (await getBlog("missing")) === undefined,
        count: (await getBlogs()).entries.length,
      };
    },
    { existing: uuid(0), missing: uuid(99) },
  );
  assert.deepEqual(checks, {
    source: "toybox",
    missing: true,
    contentfulMissing: true,
    count: 150,
  });
  isContentfulUnavailable = true;
  const partial = await page.evaluate(async () => {
    const { getBlog, getBlogs } = await import("/src/util/blogRepository.ts");
    const list = await getBlogs();
    let hasError = false;
    try {
      await getBlog("cf0");
    } catch {
      hasError = true;
    }
    return {
      count: list.entries.length,
      unavailable: list.unavailableSources,
      hasError,
    };
  });
  assert.deepEqual(partial, {
    count: 45,
    unavailable: ["Contentful"],
    hasError: true,
  });
  // A Contentful outage does not affect a Toybox detail or its UUID author.
  requests.length = 0;
  await page.goto(`${BASE}/blog/${uuid(0)}`);
  await page.getByRole("heading", { name: "Toybox 0", exact: true }).waitFor();
  await page
    .getByRole("heading", { name: "Fixture body", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", {
        name: "Fixture authorのユーザーページを開く",
        exact: true,
      })
      .getAttribute("href"),
    `${EXTERNAL_LINKS.toybox.url}users/${uuid(1000)}`,
  );
  assert.equal(
    requests.filter((url) => url.searchParams.get("content_type") === "user")
      .length,
    0,
  );
  assert.ok(
    !requests.some(
      (url) =>
        url.searchParams.get("sys.id") === uuid(0) ||
        url.searchParams.get("sys.id") === uuid(1000),
    ),
  );
  // A Toybox outage does not affect a Contentful detail or its included author.
  isContentfulUnavailable = false;
  isToyboxUnavailable = true;
  requests.length = 0;
  await page.goto(`${BASE}/blog/cf0`);
  await page
    .getByRole("heading", { name: "Contentful 0", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Fixture body", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", {
        name: "Fixture author 0のユーザーページを開く",
        exact: true,
      })
      .getAttribute("href"),
    "/author/author0",
  );
  assert.equal(
    requests.filter((url) => url.searchParams.get("content_type") === "user")
      .length,
    0,
  );
  assert.ok(!requests.some((url) => url.pathname.endsWith("/blogs/cf0")));
  const reversePartial = await page.evaluate(async () => {
    const { getBlogs } = await import("/src/util/blogRepository.ts");
    const result = await getBlogs();
    return {
      count: result.entries.length,
      unavailable: result.unavailableSources,
    };
  });
  assert.deepEqual(reversePartial, { count: 105, unavailable: ["Toybox"] });
  isContentfulUnavailable = true;
  await page.goto(`${BASE}/blog`);
  await page
    .getByText("ブログを読み込めませんでした。", { exact: false })
    .waitFor();
  isContentfulUnavailable = false;
  isToyboxUnavailable = false;
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll("article").length === 150,
  );
  await page.goto(`${BASE}/missing-static-page`);
  await page.getByRole("heading", { name: "404", exact: true }).waitFor();
  assert.equal(
    await page.locator('meta[name="robots"]').getAttribute("content"),
    "noindex",
  );
  await page.getByRole("link", { name: "ホームへ戻る" }).click();
  await page
    .getByRole("heading", { name: "Composite Computer Club" })
    .waitFor();
  assert.equal(await page.locator('meta[name="robots"]').count(), 0);
  await page.goto(`${BASE}/blog/${uuid(99)}`);
  await page.getByRole("heading", { name: "404", exact: true }).waitFor();
  assert.equal(
    await page.locator('meta[name="robots"]').getAttribute("content"),
    "noindex",
  );
  await page.goto(`${BASE}/about`);
  await page.locator('[class*="markdown-preview"]').waitFor();
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: "instant" }));
  await page.waitForFunction(() =>
    document.querySelector("header").hasAttribute("data-hidden"),
  );
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await page.waitForFunction(
    () => !document.querySelector("header").hasAttribute("data-hidden"),
  );
  await page.getByRole("button", { name: "メニューを開く" }).click();
  await page.waitForFunction(
    () => getComputedStyle(document.body).position === "fixed",
  );
  await page.mouse.move(1200, 700);
  const locked = await page.evaluate(
    () => document.body.getBoundingClientRect().top,
  );
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(150);
  assert.equal(
    await page.evaluate(() => document.body.getBoundingClientRect().top),
    locked,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-scroll-locked"),
  );
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - 400) < 2);
  await page.getByRole("button", { name: "メニューを開く" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "メニューを開く" })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${BASE}/about`);
    await page.locator('[class*="markdown-preview"]').waitFor();
    await page.evaluate(() =>
      window.scrollTo({ top: 600, behavior: "instant" }),
    );
    await page.waitForFunction(() =>
      document.querySelector("header").hasAttribute("data-hidden"),
    );
    await page.evaluate(() =>
      window.scrollTo({ top: 550, behavior: "instant" }),
    );
    await page.waitForFunction(
      () => !document.querySelector("header").hasAttribute("data-hidden"),
    );
    await page.getByRole("button", { name: "メニューを開く" }).click();
    await page.getByRole("link", { name: "お知らせ", exact: true }).click();
    await page
      .getByRole("heading", { name: "お知らせ", exact: true, level: 1 })
      .waitFor();
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-scroll-locked"),
    );
    assert.equal(await page.evaluate(() => scrollY), 0);
  }
  // Cached articles survive failed focus revalidation and recover on retry.
  await page.goto(`${BASE}/blog/cf0`);
  await page
    .getByRole("heading", { name: "Fixture body", exact: true })
    .waitFor();
  isContentfulUnavailable = true;
  await page.waitForTimeout(5100); // SWR throttles focus revalidation for five seconds.
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByRole("alert")
    .getByText("ブログを読み込めませんでした。", { exact: false })
    .waitFor();
  assert.equal(
    await page
      .getByRole("article")
      .getByRole("heading", { name: "Contentful 0", exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Fixture body", exact: true })
      .count(),
    1,
  );
  isContentfulUnavailable = false;
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await page.getByRole("alert").waitFor({ state: "detached" });
  // Loading/error routes must replace the previous 404 metadata.
  for (const [route, errorText, title] of [
    ["/author/author1", "著者情報を読み込めませんでした。", "著者"],
    ["/blog/cf0", "ブログを読み込めませんでした。", "ブログ"],
  ]) {
    await page.goto(`${BASE}/missing-static-page`);
    await page.getByRole("heading", { name: "404", exact: true }).waitFor();
    isContentfulUnavailable = true;
    await page.evaluate((path) => {
      history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, route);
    await page
      .getByRole("alert")
      .getByText(errorText, { exact: false })
      .waitFor();
    assert.equal(
      await page.title(),
      createPageMetadata({ title, pathname: route }).title,
    );
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      SITE.origin + route,
    );
    assert.equal(await page.locator('meta[name="robots"]').count(), 0);
    isContentfulUnavailable = false;
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await page
      .getByRole("heading", {
        name: route.startsWith("/author") ? "Fixture profile" : "Contentful 0",
        exact: true,
        level: 1,
      })
      .waitFor();
  }
  const profileUrls = await page.evaluate(async () => {
    const { normalizeContentfulAuthors } = await import(
      "/src/util/authorRepository.ts"
    );
    return [
      "https://example.com",
      "https://example.com/",
      "https://example.com/profile",
      "javascript:alert(1)",
      "invalid",
    ].map(
      (homePage) =>
        normalizeContentfulAuthors({
          items: [{ sys: { id: "fixture" }, fields: { homePage } }],
        })[0].links.homePage ?? null,
    );
  });
  assert.deepEqual(profileUrls, [
    "https://example.com/",
    "https://example.com/",
    "https://example.com/profile",
    null,
    null,
  ]);
  await page.clock.install();
  await page.goto(`${BASE}/`);
  const carousel = page.getByRole("region", { name: "お知らせ", exact: true });
  await carousel.waitFor();
  await page.mouse.move(0, 900);
  await carousel
    .getByRole("button", { name: "自動切替を停止", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await carousel
    .getByRole("button", { name: "自動切替を再開", exact: true })
    .waitFor();
  await page.keyboard.press("Tab");
  const pausedSlide = await carousel.getByRole("link").getAttribute("href");
  await page.clock.runFor(5100);
  assert.equal(
    await carousel.getByRole("link").getAttribute("href"),
    pausedSlide,
  );
  await carousel.hover();
  await page.mouse.move(0, 900);
  await page.clock.runFor(5100);
  assert.equal(
    await carousel.getByRole("link").getAttribute("href"),
    pausedSlide,
  );
  await carousel
    .getByRole("button", { name: "自動切替を再開", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page.clock.runFor(5100);
  assert.equal(
    await carousel.getByRole("link").getAttribute("href"),
    pausedSlide,
  );
  await page.keyboard.press("Tab");
  await page.clock.runFor(5100);
  assert.notEqual(
    await carousel.getByRole("link").getAttribute("href"),
    pausedSlide,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Verified ID-only blog URLs, UUID routing, lists without Contentful bodies, all blog/author entries, included authors without extra requests and shared batched author fallback and news date-only metadata, UUID Toybox authors, independent source outages, partial/full failures and retry, noindex recovery, menu scroll restoration/navigation and persistent carousel pause (API fixtures).",
  );
} finally {
  await browser.close();
}
