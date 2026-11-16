import { test } from "playwright/test";

import { loadContent } from "../../scripts/content/load.ts";

import assert from "node:assert/strict";

test("production Markdown media loads at mobile and desktop widths", async ({
  browser,
  baseURL,
}) => {
  const base = baseURL;
  assert.ok(base);
  const { news, communities } = loadContent();
  const routes = [
    "/about",
    ...communities.map(({ value }) => `/community/${value.slug}`),
    ...news.map(({ value }) => `/news/${value.id}`),
  ];
  let images = 0;
  let videos = 0;
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(
      (url) => url.pathname === "/works",
      (route) =>
        route.fulfill({
          json: { works: [], limit: 20, page: 1, total_count: 0 },
        }),
    );
    for (const route of routes) {
      await page.goto(base + route);
      const body = page.locator('[class*="markdown-preview"]').first();
      await body.waitFor();
      assert.equal(await page.getByRole("alert").count(), 0, route);
      const bodyImages = body.locator("img");
      for (const image of await bodyImages.all()) {
        const src = await image.getAttribute("src");
        assert.ok(
          src && !src.startsWith("data:"),
          `${route}: missing or inlined image src`,
        );
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element) =>
          (element as HTMLImageElement).decode().catch(() => {}),
        );
        assert.ok(
          await image.evaluate(
            (element) => (element as HTMLImageElement).naturalWidth > 0,
          ),
          `${route}: broken image ${src}`,
        );
        images++;
      }
      for (const video of await page.locator("main video").all()) {
        await video.scrollIntoViewIfNeeded();
        await video.evaluate((element) => {
          (element as HTMLVideoElement).preload = "metadata";
          (element as HTMLVideoElement).load();
        });
        await page.waitForFunction(
          (element) =>
            (element as HTMLVideoElement).readyState >= 1 ||
            (element as HTMLVideoElement).error,
          await video.elementHandle(),
        );
        assert.ok(
          await video.evaluate(
            (element) =>
              (element as HTMLVideoElement).videoWidth > 0 &&
              !(element as HTMLVideoElement).error,
          ),
          `${route}: broken video`,
        );
        videos++;
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${route}: overflow at ${width}px`,
      );
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    `Verified production bodies on ${routes.length} routes at 390/1440px: ${images} image loads and ${videos} video metadata loads (works API fixture).`,
  );
});
