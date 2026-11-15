import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { contentFixture } from "./fixtures/local-content.mjs";
import { prepareContent } from "./prepare-content.mjs";

test("all news folders are published and invalid metadata or missing assets fail",()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-content-"));
 const root=path.join(temporary,"content");
 const write=contentFixture(root);
 try {
  for(const name of ["communities","news"])fs.mkdirSync(path.join(root,name),{recursive:true});
  write("about/index.json",{summary:"About summary",body:"./body.md"});write("about/body.md","About");
  const article={id:"new-news",title:"Added article",digest:"Summary",body:"./body.md",thumbnail:"./assets/cover.png",createdAt:"2026-11-14T00:00:00Z",updatedAt:"2026-11-14T00:00:00Z",authorIds:[]};
  write("news/readable-folder/index.json",article);write("news/readable-folder/body.md","![photo](./assets/cover.png)");write("news/readable-folder/assets/cover.png","image");
  const output=path.join(temporary,"src/generated/contentData.ts");
  assert.equal(prepareContent(root,output).news,1);
  assert.match(fs.readFileSync(output,"utf8"),/Added article/);
  assert.doesNotMatch(fs.readFileSync(output,"utf8"), /tagIds|authorIds|canonicalOrigin/);
  write("news/readable-folder/index.json", {...article,digest:"./assets/not-an-asset.png"});
  prepareContent(root,output);
  assert.match(fs.readFileSync(output,"utf8"), /not-an-asset/);
  for (const [changes, error] of [
    [{id:"../escape"}, /Invalid news id/],
    [{digest:""}, /Missing digest/],
    [{thumbnail:"https://example.com/image.png"}, /Invalid thumbnail/],
    [{createdAt:"2026-02-30T00:00:00Z"}, /Invalid createdAt/],
    [{updatedAt:"2025-01-01T00:00:00Z"}, /precedes/],
  ]) {
    write("news/readable-folder/index.json", {...article,...changes});
    assert.throws(()=>prepareContent(root,output),error);
  }
  write("news/readable-folder/index.json", article);
  fs.unlinkSync(path.join(root,"news/readable-folder/assets/cover.png"));
  assert.throws(()=>prepareContent(root,output),/ENOENT/);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
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
   if(url.endsWith("?url"))return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(assetUrls[path.basename(fileURLToPath(url))] ?? "/assets/fixture")};`};
   if(url.endsWith("?raw"))return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(fs.readFileSync(fileURLToPath(url),"utf8"))};`};
   return nextLoad(url,context);
  }});
  try {
   const {default:content}=await import(pathToFileURL(output).href);
   assert.equal(await content.about.body(),"![first](/assets/photo-first.png)\n![second](/assets/photo-second.webp)");
  } finally {hooks.deregister();}
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

test("news is sorted by the instant even with different timezone offsets", async () => {
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-order-"));
 const root=path.join(temporary,"content");
 const write=contentFixture(root);
 try {
  fs.mkdirSync(path.join(root,"communities"),{recursive:true});
  for(const [id,createdAt] of [["earlier","2026-11-14T01:00:00+09:00"],["later","2026-11-14T00:00:00Z"]]){
   write(`news/${id}/index.json`,{id,title:id,digest:"Summary",createdAt,updatedAt:createdAt,body:"./body.md",thumbnail:"./assets/cover.png",authorIds:[]});
   write(`news/${id}/body.md`,id);write(`news/${id}/assets/cover.png`,"image");
  }
  const output=path.join(temporary,"generated/contentData.ts");
  prepareContent(root,output);
  const hooks=registerHooks({load(url,context,nextLoad){
   if(url.endsWith("?url"))return {format:"module",shortCircuit:true,source:'export default "/assets/cover.png";'};
   return nextLoad(url,context);
  }});
  try {
   const {default:content}=await import(pathToFileURL(output).href);
   assert.deepEqual(content.news.map(entry=>entry.id),["later","earlier"]);
  } finally {hooks.deregister();}
  write("communities/new/index.json",{slug:"new"});
  assert.throws(()=>prepareContent(root,output),/Invalid community definitions/);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});
