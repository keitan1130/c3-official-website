import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { contentFixture } from "./fixtures/local-content.mjs";
import { prepareContent } from "./prepare-content.mjs";
import { localFile, assetFile } from "./local-content.mjs";

test("all news folders are published and invalid metadata or missing assets fail",()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-content-"));
 const root=path.join(temporary,"content");
 const write=contentFixture(root);
 try {
  for(const name of ["communities","news"])fs.mkdirSync(path.join(root,name),{recursive:true});
  write("about/index.json",{summary:"About summary",body:"./body.md"});write("about/body.md","About");
  const article={id:"new-news",title:"Added article",digest:"Summary",body:"./body.md",thumbnail:"./assets/cover.png",publishedDate:"2026-11-14"};
  write("news/readable-folder/index.json",article);write("news/readable-folder/body.md","![photo](./assets/cover.png)");write("news/readable-folder/assets/cover.png","image");
  const output=path.join(temporary,"src/generated/contentData.ts");
  assert.equal(prepareContent(root,output).news,1);
  assert.match(fs.readFileSync(output,"utf8"),/Added article/);
  assert.doesNotMatch(fs.readFileSync(output,"utf8"), /tagIds|authorIds|createdAt|updatedAt|canonicalOrigin/);
  write("news/readable-folder/index.json", {...article,digest:"./assets/not-an-asset.png"});
  prepareContent(root,output);
  assert.match(fs.readFileSync(output,"utf8"), /not-an-asset/);
  for (const [changes, error] of [
    [{id:"../escape"}, /Invalid news id/],
    [{digest:""}, /Missing digest/],
    [{thumbnail:"https://example.com/image.png"}, /Expected local reference/],
    [{publishedDate:"2026-02-30"}, /Invalid publishedDate/],
    [{publishedDate:"2026-11-14T00:00:00Z"}, /Invalid publishedDate/],
    [{publishedDate:""}, /Invalid publishedDate/],
  ]) {
    write("news/readable-folder/index.json", {...article,...changes});
    assert.throws(()=>prepareContent(root,output),error);
  }
  write("news/readable-folder/index.json", article);
  fs.unlinkSync(path.join(root,"news/readable-folder/assets/cover.png"));
  assert.throws(()=>prepareContent(root,output),/ENOENT/);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
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
  const news = {id:"example",title:"Example",digest:"Summary",publishedDate:"2026-11-16",body:"./body.md",thumbnail:"./assets/photo.png"};
  write("news/example/index.json", news);write("news/example/body.md", "News");
  for (const entry of ["about", "communities/game", "news/example"]) {
   for (const body of ['![image](./photo.png)', '![image](photo.png)', '![image](./assets/../photo.png)', '<img src="./photo.png">', '<video src="./photo.png"></video>', '<video poster="./photo.png"></video>', '[download](./assets/../photo.png)']) {
    write(`${entry}/body.md`, body);
    assert.throws(() => prepareContent(root, output), /Invalid local reference/, `${entry}: ${body}`);
   }
   write(`${entry}/body.md`, "![image](assets/photo.png)");
   prepareContent(root, output);
  }
  write("news/example/index.json", {...news,thumbnail:"./photo.png"});
  assert.throws(() => prepareContent(root, output), /Invalid local reference/);
  write("news/example/index.json", news);
  write("communities/game/hero.mp4", "video");
  write("communities/game/index.json", {domain:"Game",body:"./body.md",mp4:"./hero.mp4"});
  assert.throws(() => prepareContent(root, output), /Invalid local reference/);
  write("communities/game/index.json", {domain:"Game",body:"./body.md",mp4:"./assets/hero.mp4"});
  fs.symlinkSync(path.join(root, "about/photo.png"), path.join(root, "about/assets/link.png"));
  assert.throws(() => assetFile(path.join(root, "about"), "assets/link.png"), /Invalid local reference/);
  fs.rmSync(path.join(root, "about/assets"), {recursive:true});
  fs.symlinkSync(path.join(root, "news/example/assets"), path.join(root, "about/assets"));
  assert.throws(() => assetFile(path.join(root, "about"), "assets/photo.png"), /Invalid local reference/);
 } finally {fs.rmSync(temporary, {recursive:true,force:true});}
});

test("parsed references resolve assets without touching code or prose", async () => {
 const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "c3-markdown-"));
 const root = path.join(temporary, "content");
 const write = contentFixture(root);
 const code = '```md\n![example](./assets/missing.png)\n<img src="./missing.png">\n```\n\n`![inline](./missing.png)`\n\nPlain ./missing.png C3_LOCAL_ASSET_0_END\n\n$$\n[formula](./missing.png)\n$$';
 const pageLinks = [
  '[別の記事](./other-article-id)', '[Aboutへ](../about)', '[お知らせ一覧](/news)',
  '[query](?tag=game)', '[hash](#heading)', '[bare](other-article-id)',
  '[File-like page](./photo.png)',
  '[encoded](./%E8%A8%98%E4%BA%8B?q=a%20b#section)', '[percent](./100%)',
  '<a href="../about?x=1&amp;y=2#heading">HTML link</a>',
  '[Reference][Page]\n\n[page]: ../about',
  '[Collapsed][]\n\n[collapsed]: ./other-article-id',
  '[Shortcut]\n\n[shortcut]: ../about',
  '[![linked image](../assets/photos/photo.png)](../about)',
 ].join("\n\n");
 try {
  write("about/index.json", {summary:"About", body:"text/body.md"});
  const markdown = [
   '![paren](<../assets/photos/photo(1).png> "photo title")',
   '![encoded](../assets/photos/photo%20two.png?v=1#preview)',
   '[![nested](../assets/photos/photo.png.webp)](../assets/photos/photo.png)',
   '| name |\n| --- |\n| [a\\|b](../assets/photos/photo.png) |',
   '- [multi\n  line](../assets/photos/photo.png)',
   '![reference][photo]\n\n[photo]: ../assets/photos/photo.png',
   '<img src="../assets/photos/photo.png?x=1&amp;y=2" alt="raw" />',
   '<video src="../assets/hero.mp4" poster="../assets/photos/photo.png"><source src="../assets/hero.mp4"><track src="../assets/captions.vtt"></video>',
   '<audio src="../assets/audio.ogg"></audio>',
   '<a href="../assets/photos/photo.png">download</a>',
   '<img src="../assets/photos/photo.png?label=&quot;quoted&quot;&amp;x=1" alt="quoted" />',
   '![remote](https://example.com/image.png)\n\n[route](/news)\n\n[anchor](#heading)',
   code,
   pageLinks,
  ].join("\n\n");
  write("about/text/body.md", markdown);
  for (const file of ["photos/photo(1).png", "photos/photo two.png", "photos/photo.png", "photos/photo.png.webp", "hero.mp4", "captions.vtt", "audio.ogg"]) write("about/assets/" + file, "fixture");
  write("news/example/index.json", {id:"example",title:"Example",digest:"Summary",publishedDate:"2026-11-16",body:"body.md",thumbnail:"assets/photos/cover.png"});
  write("news/example/body.md", "News");write("news/example/assets/photos/cover.png", "cover");
  write("communities/game/index.json", {domain:"Game",body:"body.md",mp4:"assets/hero.mp4"});write("communities/game/assets/hero.mp4", "video");
  const output = path.join(temporary, "generated/contentData.ts");
  prepareContent(root, output);
  const urls = new Map();
  const hooks = registerHooks({load(url, context, nextLoad) {
   if (url.endsWith("?url&no-inline")) {
    if (!urls.has(fileURLToPath(url))) urls.set(fileURLToPath(url), `/assets/file-${urls.size}${path.extname(fileURLToPath(url))}`);
    return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(urls.get(fileURLToPath(url)))};`};
   }
   if (url.endsWith("?raw")) return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(fs.readFileSync(fileURLToPath(url), "utf8"))};`};
   return nextLoad(url, context);
  }});
  try {
   const {default:content} = await import(pathToFileURL(output).href);
   const body = await content.about.body();
   assert.ok(body.includes(code), "code and prose remain byte-for-byte unchanged");
   for (const link of pageLinks.split("\n\n").filter(link => !link.startsWith('[![linked image]'))) assert.ok(body.includes(link), link);
   const url = file => urls.get(path.join(root, "about", "assets", file));
   for (const file of ["photos/photo(1).png", "photos/photo two.png", "photos/photo.png", "photos/photo.png.webp", "hero.mp4", "captions.vtt", "audio.ogg"]) assert.ok(body.includes(url(file)), file);
   assert.ok(body.includes(url("photos/photo two.png") + "?v=1#preview"));
   assert.ok(body.includes(url("photos/photo.png") + "?x=1&amp;y=2"));
   assert.ok(body.includes(`src="${url("hero.mp4")}"`));
   assert.ok(body.includes(`poster="${url("photos/photo.png")}"`));
   assert.ok(body.includes("https://example.com/image.png"));
   assert.ok(body.includes("[route](/news)"));
   assert.ok(body.includes("[anchor](#heading)"));
   assert.ok(body.includes(`[photo]: ${url("photos/photo.png")}`));
   assert.ok(body.includes(`[![nested](${url("photos/photo.png.webp")})](${url("photos/photo.png")})`));
   assert.ok(body.includes(`[![linked image](${url("photos/photo.png")})](../about)`));
   assert.ok(body.includes(`| [a\\|b](${url("photos/photo.png")}) |`));
   assert.ok(body.includes(`- [multi\n  line](${url("photos/photo.png")})`));
   assert.ok(body.includes(`${url("photos/photo.png")}?label=%22quoted%22&amp;x=1`));
   assert.ok(body.includes('"photo title"'));
  } finally { hooks.deregister(); }
  for (const body of ['![bad](../../outside.png)', '<img src="../../outside.png">']) {
   write("about/text/body.md", body);
   assert.throws(() => prepareContent(root, output), /Invalid local reference/);
  }
  write("about/text/body.md", '![missing](../assets/photos/missing.png)');
  assert.throws(() => prepareContent(root, output), /ENOENT/);
  for (const body of ['![ref][page]\n\n[page]: ../about', '![ref][]\n\n[ref]: ../about', '![ref]\n\n[ref]: ../about', '[shared]\n\n![image][SHARED]\n\n[shared]: ../about']) {
   write("about/text/body.md", body);
   assert.throws(() => prepareContent(root, output), /Invalid local reference|ENOENT/, body);
  }
  write("outside.png", "outside");
  fs.symlinkSync(path.join(root, "outside.png"), path.join(root, "about", "link.png"));
  assert.throws(() => localFile(path.join(root, "about"), "link.png"), /Invalid local reference/);
 } finally {fs.rmSync(temporary, {recursive:true, force:true});}
});

test("asset URLs with a shared filename prefix are resolved independently", async () => {
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-assets-"));
 const root=path.join(temporary,"content");
 const write=contentFixture(root);
 try {
  fs.mkdirSync(path.join(root,"news"),{recursive:true});
  write("about/index.json",{summary:"About summary",body:"./body.md"});
  write("about/body.md","![first](./assets/photo.png)\n![second](./assets/photo.png.webp)");
  write("about/assets/photo.png","first");write("about/assets/photo.png.webp","second");
  const output=path.join(temporary,"generated/contentData.ts");
  prepareContent(root,output);
  // Model Vite's raw-text and asset-URL imports while executing the generated loader.
  const assetUrls={"photo.png":"/assets/photo-first.png","photo.png.webp":"/assets/photo-second.webp"};
  const hooks=registerHooks({load(url,context,nextLoad){
   if(url.endsWith("?url&no-inline"))return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(assetUrls[path.basename(fileURLToPath(url))] ?? "/assets/fixture")};`};
   if(url.endsWith("?raw"))return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(fs.readFileSync(fileURLToPath(url),"utf8"))};`};
   return nextLoad(url,context);
  }});
  try {
   const {default:content}=await import(pathToFileURL(output).href);
   assert.equal(await content.about.body(),"![first](/assets/photo-first.png)\n![second](/assets/photo-second.webp)");
  } finally {hooks.deregister();}
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

test("news is sorted by publication date, then by stable id", async () => {
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-order-"));
 const root=path.join(temporary,"content");
 const write=contentFixture(root);
 try {
  fs.mkdirSync(path.join(root,"communities"),{recursive:true});
  for(const [id,publishedDate] of [["earlier","2026-11-13"],["later","2026-11-14"],["same-day","2026-11-14"]]){
   write(`news/${id}/index.json`,{id,title:id,digest:"Summary",publishedDate,body:"./body.md",thumbnail:"./assets/cover.png"});
   write(`news/${id}/body.md`,id);write(`news/${id}/assets/cover.png`,"image");
  }
  const output=path.join(temporary,"generated/contentData.ts");
  prepareContent(root,output);
  const hooks=registerHooks({load(url,context,nextLoad){
   if(url.endsWith("?url&no-inline"))return {format:"module",shortCircuit:true,source:'export default "/assets/cover.png";'};
   return nextLoad(url,context);
  }});
  try {
   const {default:content}=await import(pathToFileURL(output).href);
   assert.deepEqual(content.news.map(entry=>entry.id),["later","same-day","earlier"]);
  } finally {hooks.deregister();}
  write("communities/new/index.json",{slug:"new"});
  assert.throws(()=>prepareContent(root,output),/Invalid community definitions/);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});
