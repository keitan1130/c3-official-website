import { SITE } from "../src/config/site.ts";
import { contentFixture } from "./fixtures/content.mjs";

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const prepareScript = fileURLToPath(
  new URL("../scripts/pages/generate.mjs", import.meta.url),
);
const contentScript = fileURLToPath(
  new URL("../scripts/content/generate.mjs", import.meta.url),
);
const newScript = fileURLToPath(
  new URL("../scripts/content/new-news.mjs", import.meta.url),
);
const verifyScript = fileURLToPath(
  new URL("./pages/verify.mjs", import.meta.url),
);

test("static pages follow current content rather than a fixed page count", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "c3-pages-"));
  const write = (name, value) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  };
  try {
    contentFixture(path.join(root, "content"));
    write("content/news/published/body.md", "Body");
    write("content/news/published/index.json", {
      id: "published",
      title: 'A "quoted" title',
      digest: "News & details",
      thumbnail: "./assets/cover.png",
      body: "./body.md",
      publishedDate: "2026-11-15",
    });
    write("content/news/published/assets/cover.png", "image");
    write("public/favicon.png", "logo");
    write(".env", "VITE_SITE_URL=https://pages.example/\n");
    const build = (overrides = {}) => {
      const env = { ...process.env, NODE_ENV: "production", ...overrides };
      if (!Object.hasOwn(overrides, "VITE_SITE_URL")) delete env.VITE_SITE_URL;
      write(
        "dist/index.html",
        "<html><head><title>Fixture</title></head><body></body></html>",
      );
      execFileSync(process.execPath, [contentScript], {
        cwd: root,
        env,
        stdio: "pipe",
      });
      assert.ok(
        !fs
          .readFileSync(path.join(root, "src/generated/contentData.ts"), "utf8")
          .includes("canonicalOrigin"),
      );
      execFileSync(process.execPath, [prepareScript], {
        cwd: root,
        env,
        stdio: "pipe",
      });
      execFileSync(process.execPath, [verifyScript], {
        cwd: root,
        env,
        stdio: "pipe",
      });
    };
    build();
    assert.match(
      fs.readFileSync(path.join(root, "dist/news/published.html"), "utf8"),
      /A &quot;quoted&quot; title/,
    );
    const home = fs.readFileSync(path.join(root, "dist/index.html"), "utf8");
    assert.ok(home.includes(`${SITE.title} | ${SITE.shortName}`));
    assert.ok(home.includes('content="https://pages.example/ogp/site.png"'));
    assert.ok(home.includes('href="https://pages.example/"'));
    build({ VITE_SITE_URL: "https://override.example/" });
    assert.ok(
      fs
        .readFileSync(path.join(root, "dist/index.html"), "utf8")
        .includes('content="https://override.example/ogp/site.png"'),
    );
    assert.match(
      fs.readFileSync(path.join(root, "dist/sitemap.xml"), "utf8"),
      /https:\/\/override\.example\//,
    );
    for (const value of [
      "",
      "invalid",
      "https://example.com/path",
      "https://example.com/?q=1",
      "ftp://example.com",
    ]) {
      assert.throws(() => build({ VITE_SITE_URL: value }));
    }
    execFileSync(process.execPath, [newScript, "2026-11-15-new-event"], {
      cwd: root,
    });
    build();
    assert.ok(
      fs.existsSync(path.join(root, "dist/news/2026-11-15-new-event.html")),
    );
    assert.match(
      fs.readFileSync(path.join(root, "dist/sitemap.xml"), "utf8"),
      /\/news\/2026-11-15-new-event/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
