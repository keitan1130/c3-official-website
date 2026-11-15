import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { contentFixture } from "./fixtures/local-content.mjs";
import { SITE, PAGES, createPageMetadata } from "../src/config/site.ts";

const prepareScript = fileURLToPath(new URL("./prepare-pages.mjs", import.meta.url));
const contentScript = fileURLToPath(new URL("./prepare-content.mjs", import.meta.url));
const newScript = fileURLToPath(new URL("./new-news.mjs", import.meta.url));
const verifyScript = fileURLToPath(new URL("./verify-pages.mjs", import.meta.url));

test("static pages follow current content rather than a fixed page count", () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"c3-pages-"));
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==="string"?value:JSON.stringify(value));};
 try {
  contentFixture(path.join(root,"content"));
  write("content/news/published/body.md","Body");
  write("content/news/published/index.json",{id:"published",title:'A "quoted" title',digest:"News & details",thumbnail:"./assets/cover.png",body:"./body.md",publishedDate:"2026-11-15"});
  write("content/news/published/assets/cover.png","image");
  write("src/assets/c3-logo.webp","logo");
  const build=()=>{
   write("dist/index.html",'<html><head><title>Fixture</title></head><body></body></html>');
   execFileSync(process.execPath,[contentScript],{cwd:root});
   assert.ok(!fs.readFileSync(path.join(root,"src/generated/contentData.ts"),"utf8").includes("canonicalOrigin"));
   execFileSync(process.execPath,[prepareScript],{cwd:root});
   execFileSync(process.execPath,[verifyScript],{cwd:root});
  };
  build();
  assert.match(fs.readFileSync(path.join(root,"dist/news/published.html"),"utf8"),/A &quot;quoted&quot; title/);
  const home = fs.readFileSync(path.join(root,"dist/index.html"),"utf8");
  assert.ok(home.includes(createPageMetadata({title:PAGES.home.title,pathname:"/"}).title));
  assert.ok(home.includes(SITE.origin));
  execFileSync(process.execPath,[newScript,"2026-11-15-new-event"],{cwd:root});
  build();
  assert.ok(fs.existsSync(path.join(root,"dist/news/2026-11-15-new-event.html")));
  assert.match(fs.readFileSync(path.join(root,"dist/sitemap.xml"),"utf8"),/\/news\/2026-11-15-new-event/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
