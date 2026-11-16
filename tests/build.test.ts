import { test } from "vitest";

import { contentFixture } from "./fixtures/content.ts";

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

test("Vite generates content and Pages with the selected mode and output directory", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "c3-build-"));
  try {
    contentFixture(path.join(root, "content"));
    fs.mkdirSync(path.join(root, "public"));
    fs.writeFileSync(path.join(root, "public/favicon.png"), "fixture");
    fs.writeFileSync(
      path.join(root, "index.html"),
      '<html><head></head><body><div id="root"></div></body></html>',
    );
    fs.writeFileSync(
      path.join(root, ".env.production"),
      "VITE_SITE_URL=https://production.example\n",
    );
    fs.writeFileSync(
      path.join(root, ".env.staging"),
      "VITE_SITE_URL=https://staging.example\n",
    );
    const env = { ...process.env };
    delete env.VITE_SITE_URL;
    delete env.NODE_ENV;
    const vite = fileURLToPath(
      new URL("../node_modules/vite/bin/vite.js", import.meta.url),
    );
    const config = fileURLToPath(new URL("../vite.config.ts", import.meta.url));
    execFileSync(
      process.execPath,
      [
        vite,
        "build",
        root,
        "--config",
        config,
        "--mode",
        "staging",
        "--outDir",
        "output",
      ],
      { env, stdio: "pipe" },
    );
    assert.ok(fs.existsSync(path.join(root, "src/generated/contentData.ts")));
    for (const file of [
      "index.html",
      "about.html",
      "sitemap.xml",
      "robots.txt",
    ]) {
      const text = fs.readFileSync(path.join(root, "output", file), "utf8");
      assert.ok(text.includes("https://staging.example"), file);
      assert.ok(!text.includes("https://production.example"), file);
    }
    assert.ok(fs.existsSync(path.join(root, "output/404.html")));
    assert.ok(!fs.existsSync(path.join(root, "dist")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
