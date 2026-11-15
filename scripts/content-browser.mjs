import assert from "node:assert/strict";
import { chromium } from "playwright";
import { preview } from "vite";
import { loadContent } from "./local-content.mjs";

// Run against dist so Vite's production asset handling is part of the check.
const server = await preview({ configFile: false, preview: { host: "127.0.0.1", port: 0, open: false } });
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const { news, communities } = loadContent();
  const routes = ["/about", ...communities.map(({ value }) => `/community/${value.slug}`), ...news.map(({ value }) => `/news/${value.id}`)];
  let images = 0;
  let videos = 0;
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route(url => url.pathname === "/works", route => route.fulfill({ json: { works: [], limit: 20, page: 1, total_count: 0 } }));
    for (const route of routes) {
      await page.goto(base + route);
      const body = page.locator('[class*="markdown-preview"]').first();
      await body.waitFor();
      assert.equal(await page.getByRole("alert").count(), 0, route);
      const bodyImages = body.locator("img");
      for (const image of await bodyImages.all()) {
        const src = await image.getAttribute("src");
        assert.ok(src && !src.startsWith("data:"), `${route}: missing or inlined image src`);
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(element => element.decode().catch(() => {}));
        assert.ok(await image.evaluate(element => element.naturalWidth > 0), `${route}: broken image ${src}`);
        images++;
      }
      for (const video of await page.locator("main video").all()) {
        await video.scrollIntoViewIfNeeded();
        await video.evaluate(element => { element.preload = "metadata"; element.load(); });
        await page.waitForFunction(element => element.readyState >= 1 || element.error, await video.elementHandle());
        assert.ok(await video.evaluate(element => element.videoWidth > 0 && !element.error), `${route}: broken video`);
        videos++;
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route}: overflow at ${width}px`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`Verified production bodies on ${routes.length} routes at 390/1440px: ${images} image loads and ${videos} video metadata loads (works API fixture).`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
