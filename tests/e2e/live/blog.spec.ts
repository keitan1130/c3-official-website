import { test } from "playwright/test";

import assert from "node:assert/strict";

test("live blog APIs and failure recovery", async ({ browser, baseURL }) => {
  const BASE = baseURL;
  assert.ok(BASE);
  test.skip(
    process.env.TEST_LIVE_API !== "1",
    "Set TEST_LIVE_API=1 to contact live APIs",
  );
  assert.ok(
    process.env.TEST_BASE_URL,
    "Specify TEST_BASE_URL for live API checks",
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(`${BASE}/blog`);
  await page
    .getByRole("heading", { name: "ブログ", exact: true, level: 1 })
    .waitFor();
  await page
    .getByText("ブログを読み込み中…", { exact: true })
    .waitFor({ state: "hidden" });
  const result = await page.evaluate(async () => {
    const { getBlogs } = await import("/src/util/blogRepository.ts");
    const data = await getBlogs();
    return {
      count: data.entries.length,
      unavailable: data.unavailableSources,
      samples: ["contentful", "toybox"].map((source) => {
        const entry = data.entries.find((item) => item.source === source);
        return entry ? { id: entry.id, title: entry.title, source } : null;
      }),
    };
  });
  const allowCors = process.env.TEST_ALLOW_TOYBOX_CORS === "1";
  if (allowCors)
    assert.ok(
      result.unavailable.length === 0 ||
        JSON.stringify(result.unavailable) === JSON.stringify(["Toybox"]),
    );
  else assert.deepEqual(result.unavailable, []);
  assert.equal(await page.getByRole("article").count(), result.count);
  for (const sample of result.samples) {
    if (!sample && allowCors) continue;
    assert.ok(sample);
    await page.goto(`${BASE}/blog/${sample.id}`);
    await page
      .getByRole("heading", { name: sample.title, exact: true, level: 1 })
      .first()
      .waitFor();
    await page
      .getByText("読み込み中…", { exact: true })
      .waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("alert").count(), 0);
  }
  if (!allowCors) {
    await page.route(/cdn\.contentful\.com/, (route) => route.abort());
    await page.goto(`${BASE}/blog`);
    await page
      .getByText("一部のブログを取得できませんでした。", { exact: false })
      .waitFor();
    assert.ok((await page.getByRole("article").count()) > 0);
    await page.unrouteAll();
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await page.getByRole("alert").waitFor({ state: "hidden" });
  }
  await page.route(/cdn\.contentful\.com|\/api\/v1\/blogs/, (route) =>
    route.abort(),
  );
  await page.goto(`${BASE}/blog`);
  await page
    .getByText("ブログを読み込めませんでした。", { exact: false })
    .waitFor();
  await page.unrouteAll();
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await page.getByRole("article").first().waitFor();
  console.log(
    JSON.stringify({
      blogCount: result.count,
      bothSourceDetails: !allowCors,
      partialFailure: !allowCors,
      toyboxCorsDeferred: allowCors,
      fullFailureAndRetry: true,
    }),
  );
});
