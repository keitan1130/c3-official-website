import { micromark } from "micromark";
import { parseFragment } from "parse5";
import { test } from "vitest";

import { prepareContent } from "../scripts/content/generate.ts";
import { assetFile, localFile } from "../scripts/content/load.ts";
import { markdownAssetEdits } from "../scripts/content/markdownAssets.ts";
import { contentFixture } from "./fixtures/content.ts";
import { loadGeneratedContent } from "./helpers/generated-content.ts";

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { DefaultTreeAdapterMap } from "parse5";
import type { ViteDevServer } from "vite";

test("image descriptions do not validate or rewrite resources that only become alt text", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-image-alt-"));
  try {
    const root = path.join(temporary, "content");
    const write = contentFixture(root);
    write("about/assets/real.png", "image");
    const markdown = [
      "![outer ![inner](./assets/missing.png)](./assets/real.png)",
      "![caption [link](./assets/missing.pdf)](./assets/real.png)",
      "![outer ![inner][ref]](./assets/real.png)",
      '![caption <img src="./assets/missing.png">](./assets/real.png)',
      "[ref]: ./assets/missing.png",
    ].join("\n\n");
    write("about/body.md", markdown);
    const output = path.join(temporary, "generated/contentData.ts");
    assert.doesNotThrow(() => prepareContent(root, output));
    const urls: string[] = [];
    markdownAssetEdits(markdown, (url: string) => {
      urls.push(url);
      return url;
    });
    assert.deepEqual(urls, Array(4).fill("./assets/real.png"));
    assert.equal((micromark(markdown).match(/<img /g) ?? []).length, 4);
    // A reference that is also used outside alt text must still be checked.
    write("about/body.md", `${markdown}\n\n![visible][ref]`);
    assert.throws(() => prepareContent(root, output), /ENOENT/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("generated Markdown and HTML preserve URL character references after rendering", async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-url-entities-"));
  try {
    const root = path.join(temporary, "content");
    const write = contentFixture(root);
    const markdown = [
      "![named](./assets/image.png?label=&amp;copy;&amp;x=1#part)",
      "![numeric](./assets/image.png?label=&amp;#65;)",
      "[download](./assets/image.png?label=&amp;amp;)",
      "![reference][image]\n\n[image]: ./assets/image.png?label=&amp;copy;",
      '<img src="./assets/image.png?label=&amp;copy;&amp;x=1">',
    ].join("\n\n");
    write("about/assets/image.png", "image");
    write("about/body.md", markdown);
    const output = path.join(temporary, "generated/contentData.ts");
    prepareContent(root, output);
    const generated = loadGeneratedContent(output, {
      "image.png": "/assets/imported.png",
    });
    const collectUrls = (text: string) => {
      const urls: string[] = [];
      const walk = (node: DefaultTreeAdapterMap["node"]) => {
        for (const attr of "attrs" in node ? node.attrs : [])
          if (["src", "href"].includes(attr.name)) urls.push(attr.value);
        for (const child of "childNodes" in node ? node.childNodes : [])
          walk(child);
      };
      walk(parseFragment(micromark(text)));
      return urls;
    };
    assert.deepEqual(
      collectUrls(generated.body),
      collectUrls(markdown).map((url) =>
        url.replace("./assets/image.png", "/assets/imported.png"),
      ),
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("reserved characters in source paths work through real Vite build and dev imports", async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-vite-paths-"));
  let server: ViteDevServer | undefined;
  try {
    const root = path.join(temporary, "content");
    const write = contentFixture(root);
    write("about/index.json", {
      summary: "About",
      body: "./text#1/body?draft.md",
    });
    write(
      "about/text#1/body?draft.md",
      "![hash](../assets/photo%231.png)\n\n![query](../assets/photo%3F2.png)",
    );
    write("about/assets/photo#1.png", "hash image");
    write("about/assets/photo?2.png", "query image");
    const output = path.join(temporary, "generated/contentData.ts");
    prepareContent(root, output);
    fs.writeFileSync(
      path.join(temporary, "main.js"),
      'import content from "./generated/contentData.ts"; console.log(content, await content.about.body());',
    );
    const { build, createServer } = await import("vite");
    const result = await build({
      root: temporary,
      configFile: false,
      logLevel: "silent",
      build: {
        write: false,
        minify: false,
        target: "esnext",
        rolldownOptions: { input: path.join(temporary, "main.js") },
      },
    });
    assert.ok(!Array.isArray(result) && "output" in result);
    const assets = result.output.filter((entry) => entry.type === "asset");
    for (const source of ["hash image", "query image"])
      assert.ok(
        assets.some((asset) => String(asset.source) === source),
        source,
      );
    assert.ok(
      result.output.some(
        (entry) => entry.type === "chunk" && entry.code.includes("![hash]"),
      ),
      "body is included in its dynamic chunk",
    );
    server = await createServer({
      root: temporary,
      configFile: false,
      logLevel: "silent",
      server: { host: "127.0.0.1", port: 0 },
    });
    await server.listen();
    const address = server.httpServer?.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    for (const name of fs.readdirSync(
      path.join(temporary, "generated/contentFiles"),
    )) {
      const file = path.join(temporary, "generated/contentFiles", name);
      const response = await fetch(`${base}/generated/contentFiles/${name}`);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), fs.readFileSync(file, "utf8"));
      const module = await server.transformRequest(
        `/generated/contentFiles/${name}${name.endsWith(".md") ? "?raw" : "?url&no-inline"}`,
      );
      assert.ok(module?.code.includes("export default"));
    }
    // Rebuilding after a source change removes obsolete generated copies.
    write("about/assets/photo#1.png", "updated image");
    prepareContent(root, output);
    const staged = fs
      .readdirSync(path.join(temporary, "generated/contentFiles"))
      .map((name) =>
        fs.readFileSync(
          path.join(temporary, "generated/contentFiles", name),
          "utf8",
        ),
      );
    assert.ok(staged.includes("updated image"));
    assert.ok(!staged.includes("hash image"));
  } finally {
    await server?.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("only referenced first definitions are validated and rewritten", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-definitions-"));
  const root = path.join(temporary, "content");
  const write = contentFixture(root);
  const output = path.join(temporary, "generated/contentData.ts");
  try {
    write("about/assets/valid.png", "image");
    const ignored =
      "[unused]: ./assets/missing.png\n\n[unused-image]: ./outside.png\n\n[photo]: ./assets/ignored.png";
    const markdown =
      "[ Photo ]: ./assets/valid.png\n\n![full][photo]\n\n![PHOTO][]\n\n![Photo]\n\n[download][Photo]\n\n" +
      ignored;
    write("about/body.md", markdown);
    prepareContent(root, output);
    const resolved: { url: string; kind: string }[] = [];
    const edits = markdownAssetEdits(
      markdown,
      (url: string, _context: string, kind: string) => {
        resolved.push({ url, kind });
        return "/assets/resolved.png";
      },
    );
    assert.deepEqual(resolved, [{ url: "./assets/valid.png", kind: "media" }]);
    let body = markdown;
    for (const edit of edits.toReversed())
      body = body.slice(0, edit.start) + edit.value + body.slice(edit.end);
    assert.ok(body.startsWith("[ Photo ]: /assets/resolved.png"));
    assert.ok(
      body.endsWith(ignored),
      "unused and duplicate definitions remain unchanged",
    );
    for (const markdown of [
      "Text.\n\n[unused]: ./assets/missing.png",
      "[page][ref]\n\n[ref]: ../about\n\n[REF]: ./assets/missing.png",
      "![photo][ref]\n\n[ref]: https://example.com/image.png\n\n[REF]: ./assets/missing.png",
      "`![sample][unused]`\n\n```md\n[unused]\n```\n\n[unused]: ./assets/missing.png",
    ]) {
      write("about/body.md", markdown);
      assert.doesNotThrow(() => prepareContent(root, output), markdown);
    }
    for (const markdown of [
      "![used][ref]\n\n[ref]: ./assets/missing.png",
      "[download][ref]\n\n[ref]: ./assets/missing.png",
      "![used][ref]\n\n[ref]: ./assets/missing.png\n\n[REF]: ./assets/valid.png",
    ]) {
      write("about/body.md", markdown);
      assert.throws(() => prepareContent(root, output), /ENOENT/, markdown);
    }
    const normalized: { url: string; kind: string }[] = [];
    markdownAssetEdits(
      "[link][Spaced label]\n\n[spaced\t LABEL]: ./assets/valid.png\n\n[SPACED label]: ./assets/missing.png",
      (url: string, _context: string, kind: string) => {
        normalized.push({ url, kind });
        return url;
      },
    );
    assert.deepEqual(normalized, [{ url: "./assets/valid.png", kind: "link" }]);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("all news folders are published and invalid metadata or missing assets fail", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-content-"));
  const root = path.join(temporary, "content");
  const write = contentFixture(root);
  try {
    for (const name of ["communities", "news"])
      fs.mkdirSync(path.join(root, name), { recursive: true });
    write("about/index.json", { summary: "About summary", body: "./body.md" });
    write("about/body.md", "About");
    const article = {
      id: "new-news",
      title: "Added article",
      digest: "Summary",
      body: "./body.md",
      thumbnail: "./assets/cover.png",
      publishedDate: "2026-11-14",
    };
    write("news/readable-folder/index.json", article);
    write("news/readable-folder/body.md", "![photo](./assets/cover.png)");
    write("news/readable-folder/assets/cover.png", "image");
    const output = path.join(temporary, "src/generated/contentData.ts");
    assert.equal(prepareContent(root, output).news, 1);
    assert.match(fs.readFileSync(output, "utf8"), /Added article/);
    assert.doesNotMatch(
      fs.readFileSync(output, "utf8"),
      /tagIds|authorIds|createdAt|updatedAt|canonicalOrigin/,
    );
    write("news/readable-folder/index.json", {
      ...article,
      digest: "./assets/not-an-asset.png",
    });
    prepareContent(root, output);
    assert.match(fs.readFileSync(output, "utf8"), /not-an-asset/);
    for (const [changes, error] of [
      [{ id: "../escape" }, /Invalid news id/],
      [{ digest: "" }, /Missing digest/],
      [
        { thumbnail: "https://example.com/image.png" },
        /Expected local reference/,
      ],
      [{ publishedDate: "2026-02-30" }, /Invalid publishedDate/],
      [{ publishedDate: "2026-11-14T00:00:00Z" }, /Invalid publishedDate/],
      [{ publishedDate: "" }, /Invalid publishedDate/],
    ] as [Record<string, string>, RegExp][]) {
      write("news/readable-folder/index.json", { ...article, ...changes });
      assert.throws(() => prepareContent(root, output), error);
    }
    write("news/readable-folder/index.json", article);
    fs.unlinkSync(path.join(root, "news/readable-folder/assets/cover.png"));
    assert.throws(() => prepareContent(root, output), /ENOENT/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("all local media references must stay inside each entry's assets directory", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-assets-only-"));
  const root = path.join(temporary, "content");
  const write = contentFixture(root);
  const output = path.join(temporary, "generated/contentData.ts");
  try {
    for (const entry of ["about", "communities/game", "news/example"]) {
      write(`${entry}/photo.png`, "image");
      write(`${entry}/assets/photo.png`, "image");
    }
    const news = {
      id: "example",
      title: "Example",
      digest: "Summary",
      publishedDate: "2026-11-16",
      body: "./body.md",
      thumbnail: "./assets/photo.png",
    };
    write("news/example/index.json", news);
    write("news/example/body.md", "News");
    for (const entry of ["about", "communities/game", "news/example"]) {
      for (const body of [
        "![image](./photo.png)",
        "![image](photo.png)",
        "![image](./assets/../photo.png)",
        '<img src="./photo.png">',
        '<video src="./photo.png"></video>',
        '<video poster="./photo.png"></video>',
        "[download](./assets/../photo.png)",
      ]) {
        write(`${entry}/body.md`, body);
        assert.throws(
          () => prepareContent(root, output),
          /Invalid local reference/,
          `${entry}: ${body}`,
        );
      }
      write(`${entry}/body.md`, "![image](assets/photo.png)");
      prepareContent(root, output);
    }
    write("news/example/index.json", { ...news, thumbnail: "./photo.png" });
    assert.throws(
      () => prepareContent(root, output),
      /Invalid local reference/,
    );
    write("news/example/index.json", news);
    write("communities/game/hero.mp4", "video");
    write("communities/game/index.json", {
      domain: "Game",
      body: "./body.md",
      mp4: "./hero.mp4",
    });
    assert.throws(
      () => prepareContent(root, output),
      /Invalid local reference/,
    );
    write("communities/game/index.json", {
      domain: "Game",
      body: "./body.md",
      mp4: "./assets/hero.mp4",
    });
    fs.symlinkSync(
      path.join(root, "about/photo.png"),
      path.join(root, "about/assets/link.png"),
    );
    assert.throws(
      () => assetFile(path.join(root, "about"), "assets/link.png"),
      /Invalid local reference/,
    );
    fs.rmSync(path.join(root, "about/assets"), { recursive: true });
    fs.symlinkSync(
      path.join(root, "news/example/assets"),
      path.join(root, "about/assets"),
    );
    assert.throws(
      () => assetFile(path.join(root, "about"), "assets/photo.png"),
      /Invalid local reference/,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("parsed references resolve assets without touching code or prose", async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-markdown-"));
  const root = path.join(temporary, "content");
  const write = contentFixture(root);
  const code =
    '```md\n![example](./assets/missing.png)\n<img src="./missing.png">\n```\n\n`![inline](./missing.png)`\n\nPlain ./missing.png C3_LOCAL_ASSET_0_END\n\n$$\n[formula](./missing.png)\n$$';
  const pageLinks = [
    "[別の記事](./other-article-id)",
    "[Aboutへ](../about)",
    "[お知らせ一覧](/news)",
    "[query](?tag=game)",
    "[hash](#heading)",
    "[bare](other-article-id)",
    "[File-like page](./photo.png)",
    "[encoded](./%E8%A8%98%E4%BA%8B?q=a%20b#section)",
    "[percent](./100%)",
    '<a href="../about?x=1&amp;y=2#heading">HTML link</a>',
    "[Reference][Page]\n\n[page]: ../about",
    "[Collapsed][]\n\n[collapsed]: ./other-article-id",
    "[Shortcut]\n\n[shortcut]: ../about",
    "[![linked image](../assets/photos/photo.png)](../about)",
  ].join("\n\n");
  try {
    write("about/index.json", { summary: "About", body: "text/body.md" });
    const markdown = [
      '![paren](<../assets/photos/photo(1).png> "photo title")',
      "![encoded](../assets/photos/photo%20two.png?v=1#preview)",
      "[![nested](../assets/photos/photo.png.webp)](../assets/photos/photo.png)",
      "| name |\n| --- |\n| [a\\|b](../assets/photos/photo.png) |",
      "- [multi\n  line](../assets/photos/photo.png)",
      "![reference][photo]\n\n[photo]: ../assets/photos/photo.png",
      '<img src="../assets/photos/photo.png?x=1&amp;y=2" alt="raw" />',
      '<video src="../assets/hero.mp4" poster="../assets/photos/photo.png"><source src="../assets/hero.mp4"><track src="../assets/captions.vtt"></video>',
      '<audio src="../assets/audio.ogg"></audio>',
      '<a href="../assets/photos/photo.png">download</a>',
      '<img src="../assets/photos/photo.png?label=&quot;quoted&quot;&amp;x=1" alt="quoted" />',
      "![remote](https://example.com/image.png)\n\n[route](/news)\n\n[anchor](#heading)",
      code,
      pageLinks,
    ].join("\n\n");
    write("about/text/body.md", markdown);
    for (const file of [
      "photos/photo(1).png",
      "photos/photo two.png",
      "photos/photo.png",
      "photos/photo.png.webp",
      "hero.mp4",
      "captions.vtt",
      "audio.ogg",
    ])
      write(`about/assets/${file}`, "fixture");
    write("news/example/index.json", {
      id: "example",
      title: "Example",
      digest: "Summary",
      publishedDate: "2026-11-16",
      body: "body.md",
      thumbnail: "assets/photos/cover.png",
    });
    write("news/example/body.md", "News");
    write("news/example/assets/photos/cover.png", "cover");
    write("communities/game/index.json", {
      domain: "Game",
      body: "body.md",
      mp4: "assets/hero.mp4",
    });
    write("communities/game/assets/hero.mp4", "video");
    const output = path.join(temporary, "generated/contentData.ts");
    prepareContent(root, output);
    const generated = loadGeneratedContent(output);
    {
      const body = generated.body;
      assert.ok(
        body.includes(code),
        "code and prose remain byte-for-byte unchanged",
      );
      for (const link of pageLinks
        .split("\n\n")
        .filter((link) => !link.startsWith("[![linked image]")))
        assert.ok(body.includes(link), link);
      const url = (file: string) => {
        const value =
          generated.assets[path.join(root, "about", "assets", file)];
        assert.ok(value, file);
        return value;
      };
      for (const file of [
        "photos/photo(1).png",
        "photos/photo two.png",
        "photos/photo.png",
        "photos/photo.png.webp",
        "hero.mp4",
        "captions.vtt",
        "audio.ogg",
      ])
        assert.ok(body.includes(url(file)), file);
      assert.ok(body.includes(`${url("photos/photo two.png")}?v=1#preview`));
      assert.ok(body.includes(`${url("photos/photo.png")}?x=1&amp;y=2`));
      assert.ok(body.includes(`src="${url("hero.mp4")}"`));
      assert.ok(body.includes(`poster="${url("photos/photo.png")}"`));
      assert.ok(body.includes("https://example.com/image.png"));
      assert.ok(body.includes("[route](/news)"));
      assert.ok(body.includes("[anchor](#heading)"));
      assert.ok(body.includes(`[photo]: ${url("photos/photo.png")}`));
      assert.ok(
        body.includes(
          `[![nested](${url("photos/photo.png.webp")})](${url("photos/photo.png")})`,
        ),
      );
      assert.ok(
        body.includes(
          `[![linked image](${url("photos/photo.png")})](../about)`,
        ),
      );
      assert.ok(body.includes(`| [a\\|b](${url("photos/photo.png")}) |`));
      assert.ok(body.includes(`- [multi\n  line](${url("photos/photo.png")})`));
      assert.ok(
        body.includes(`${url("photos/photo.png")}?label=%22quoted%22&amp;x=1`),
      );
      assert.ok(body.includes('"photo title"'));
    }
    for (const body of [
      "![bad](../../outside.png)",
      '<img src="../../outside.png">',
    ]) {
      write("about/text/body.md", body);
      assert.throws(
        () => prepareContent(root, output),
        /Invalid local reference/,
      );
    }
    write("about/text/body.md", "![missing](../assets/photos/missing.png)");
    assert.throws(() => prepareContent(root, output), /ENOENT/);
    for (const body of [
      "![ref][page]\n\n[page]: ../about",
      "![ref][]\n\n[ref]: ../about",
      "![ref]\n\n[ref]: ../about",
      "[shared]\n\n![image][SHARED]\n\n[shared]: ../about",
    ]) {
      write("about/text/body.md", body);
      assert.throws(
        () => prepareContent(root, output),
        /Invalid local reference|ENOENT/,
        body,
      );
    }
    write("outside.png", "outside");
    fs.symlinkSync(
      path.join(root, "outside.png"),
      path.join(root, "about", "link.png"),
    );
    assert.throws(
      () => localFile(path.join(root, "about"), "link.png"),
      /Invalid local reference/,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("asset URLs with a shared filename prefix are resolved independently", async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-assets-"));
  const root = path.join(temporary, "content");
  const write = contentFixture(root);
  try {
    fs.mkdirSync(path.join(root, "news"), { recursive: true });
    write("about/index.json", { summary: "About summary", body: "./body.md" });
    write(
      "about/body.md",
      "![first](./assets/photo.png)\n![second](./assets/photo.png.webp)",
    );
    write("about/assets/photo.png", "first");
    write("about/assets/photo.png.webp", "second");
    const output = path.join(temporary, "generated/contentData.ts");
    prepareContent(root, output);
    // Model Vite's raw-text and asset-URL imports while executing the generated loader.
    const assetUrls = {
      "photo.png": "/assets/photo-first.png",
      "photo.png.webp": "/assets/photo-second.webp",
    };
    const generated = loadGeneratedContent(output, assetUrls);
    assert.equal(
      generated.body,
      "![first](/assets/photo-first.png)\n![second](/assets/photo-second.webp)",
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("news is sorted by publication date, then by stable id", async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-order-"));
  const root = path.join(temporary, "content");
  const write = contentFixture(root);
  try {
    fs.mkdirSync(path.join(root, "communities"), { recursive: true });
    for (const [id, publishedDate] of [
      ["earlier", "2026-11-13"],
      ["later", "2026-11-14"],
      ["same-day", "2026-11-14"],
    ]) {
      write(`news/${id}/index.json`, {
        id,
        title: id,
        digest: "Summary",
        publishedDate,
        body: "./body.md",
        thumbnail: "./assets/cover.png",
      });
      write(`news/${id}/body.md`, id);
      write(`news/${id}/assets/cover.png`, "image");
    }
    const output = path.join(temporary, "generated/contentData.ts");
    prepareContent(root, output);
    const generated = loadGeneratedContent(output);
    assert.deepEqual(generated.newsIds, ["later", "same-day", "earlier"]);
    write("communities/new/index.json", { slug: "new" });
    assert.throws(
      () => prepareContent(root, output),
      /Invalid community definitions/,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
