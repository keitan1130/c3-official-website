import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const works = Array.from({ length: 20 }, (_, index) => ({
  id: `work-${index}`, title: `作品 ${index + 1}`, visibility: "public",
  thumbnail_url: `${BASE}/test-work.svg`,
}));
const response = { works, page: 1, limit: 20, total_count: 20 };
try {
  for (const width of [390, 1440]) {
    for (const pathname of ["/", "/about"]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      await page.route("**/test-work.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="gray"/></svg>' }));
      await page.route(/cdn\.contentful\.com|kodomobeya/, route => route.abort());
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      let requests = 0;
      await page.route(url => url.pathname === "/works", async route => {
        requests++;
        const url = new URL(route.request().url());
        assert.equal(url.searchParams.get("limit"), "20");
        assert.equal(url.searchParams.get("page"), "1");
        assert.equal(url.searchParams.get("sort"), "newest");
        assert.equal(url.searchParams.get("visibility"), "public");
        const headers = await route.request().allHeaders();
        assert.equal(headers.authorization, undefined);
        assert.equal(headers.cookie, undefined);
        await gate;
        await route.fulfill({ json: response });
      });
      await page.goto(BASE + pathname, { waitUntil: "domcontentloaded" });
      await page.getByText("作品を読み込み中…", { exact: true }).waitFor();
      release();
      const images = page.locator('img[title^="作品 "]');
      await images.nth(39).waitFor({ state: "attached" });
      assert.equal(await images.count(), 40, "20作品をアニメーション用に2組表示");
      assert.equal(new Set(await images.evaluateAll(items => items.map(item => item.title))).size, 20);
      assert.equal(requests, 1);
      await page.getByRole("link", { name: "作品を見る" }).scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('img[title^="作品 "]')].some(image => image.naturalWidth > 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.close();
    }
  }
  for (const mode of ["error", "empty", "invalid"]) {
    const page = await browser.newPage();
    let isRecovered = false;
    await page.route(url => url.pathname === "/works", route => {
      if (isRecovered) return route.fulfill({ json: response });
      if (mode === "error") return route.fulfill({ status: 500, json: { message: "Failed" } });
      return route.fulfill({ json: mode === "empty" ? { ...response, works: [] } : { unexpected: [] } });
    });
    await page.goto(BASE + "/about");
    if (mode === "empty") {
      await page.getByText("公開作品はまだありません。", { exact: true }).waitFor();
    } else {
      await page.getByText("作品を読み込めませんでした。", { exact: true }).waitFor();
      isRecovered = true;
      await page.getByRole("button", { name: "再試行", exact: true }).click();
      await page.locator('img[title^="作品 "]').nth(39).waitFor({ state: "attached" });
      assert.equal(await page.getByRole("alert").count(), 0);
    }
    await page.getByRole("link", { name: "作品を見る" }).waitFor();
    await page.getByRole("heading", { name: "C3について", level: 1 }).waitFor();
    await page.close();
  }
  console.log("Works API fixture checks passed: home/About at 390/1440px, 20 works, request contract, loading, images, empty, HTTP/schema failures and retry. Live API/CORS not verified.");
} finally {
  await browser.close();
}
