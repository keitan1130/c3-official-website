import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { prepareContent } from "./prepare-content.mjs";

test("new article folders are discovered, drafts stay out, and broken published images fail",()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-content-"));
 const root=path.join(temporary,"content");
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==="string"?value:JSON.stringify(value));};
 try {
  for(const name of ["communities","news"])fs.mkdirSync(path.join(root,name),{recursive:true});
  write("tags.json",[]);write("site/index.json",{communities:[]});
  write("about/index.json",{body:"./body.md"});write("about/body.md","About");
  const article={id:"new-news",title:"Added article",body:"./body.md",thumbnail:"./assets/cover.png",isPublished:true,createdAt:"2026-11-14T00:00:00Z",updatedAt:"2026-11-14T00:00:00Z",authorIds:[],tagIds:[]};
  write("news/readable-folder/index.json",article);write("news/readable-folder/body.md","![photo](./assets/cover.png)");write("news/readable-folder/assets/cover.png","image");
  write("news/draft/index.json",{...article,id:"DRAFT_SECRET",isPublished:false,thumbnail:"./assets/DRAFT_SECRET.png"});write("news/draft/body.md","DRAFT_SECRET");
  const output=path.join(temporary,"src/generated/contentData.ts");
  assert.equal(prepareContent(root,output).news,1);
  assert.match(fs.readFileSync(output,"utf8"),/Added article/);
  assert.doesNotMatch(fs.readFileSync(output,"utf8"),/DRAFT_SECRET/);
  fs.unlinkSync(path.join(root,"news/readable-folder/assets/cover.png"));
  assert.throws(()=>prepareContent(root,output),/ENOENT/);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

test("asset URLs with a shared filename prefix are resolved independently", async () => {
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-assets-"));
 const root=path.join(temporary,"content");
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==="string"?value:JSON.stringify(value));};
 try {
  fs.mkdirSync(path.join(root,"news"),{recursive:true});
  write("tags.json",[]);write("site/index.json",{communities:["test"]});
  write("about/index.json",{body:"./body.md"});
  write("about/body.md","![first](./assets/photo.png)\n![second](./assets/photo.png.webp)");
  write("about/assets/photo.png","first");write("about/assets/photo.png.webp","second");
  write("communities/test/index.json",{slug:"test"});
  const output=path.join(temporary,"generated/contentData.ts");
  prepareContent(root,output);
  // Model Vite's raw-text and asset-URL imports while executing the generated loader.
  const assetUrls={"photo.png":"/assets/photo-first.png","photo.png.webp":"/assets/photo-second.webp"};
  const hooks=registerHooks({load(url,context,nextLoad){
   if(url.endsWith("?url"))return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(assetUrls[path.basename(fileURLToPath(url))])};`};
   if(url.endsWith("?raw"))return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(fs.readFileSync(fileURLToPath(url),"utf8"))};`};
   return nextLoad(url,context);
  }});
  try {
   const {default:content}=await import(pathToFileURL(output).href);
   assert.equal(await content.about.body(),"![first](/assets/photo-first.png)\n![second](/assets/photo-second.webp)");
  } finally {hooks.deregister();}
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

test("published news is sorted by the instant even with different timezone offsets", async () => {
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-order-"));
 const root=path.join(temporary,"content");
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==="string"?value:JSON.stringify(value));};
 try {
  fs.mkdirSync(path.join(root,"communities"),{recursive:true});
  write("tags.json",[]);write("site/index.json",{communities:[]});write("about/index.json",{});
  for(const [id,createdAt] of [["earlier","2026-11-14T01:00:00+09:00"],["later","2026-11-14T00:00:00Z"]]){
   write(`news/${id}/index.json`,{id,title:id,createdAt,updatedAt:createdAt,isPublished:true,body:"./body.md",thumbnail:"https://example.com/image.png",authorIds:[],tagIds:[]});
   write(`news/${id}/body.md`,id);
  }
  const output=path.join(temporary,"generated/contentData.ts");
  prepareContent(root,output);
  const {default:content}=await import(pathToFileURL(output).href);
  assert.deepEqual(content.news.map(entry=>entry.id),["later","earlier"]);
  write("communities/new/index.json",{slug:"new"});
  assert.throws(()=>prepareContent(root,output),/Invalid community order/);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});
