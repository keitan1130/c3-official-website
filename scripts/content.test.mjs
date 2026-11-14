import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareContent } from "./prepare-content.mjs";

test("new article folders are discovered, drafts stay out, and broken published images fail",()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"c3-content-"));
 const root=path.join(temporary,"content");
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==="string"?value:JSON.stringify(value));};
 try {
  for(const name of ["communities","news","featured-works"])fs.mkdirSync(path.join(root,name),{recursive:true});
  write("tags.json",[]);write("site/index.json",{communities:[]});
  write("site/assets/s_logo.webp","logo");write("site/assets/loading.webp","poster");
  write("about/index.json",{body:"./body.md"});write("about/body.md","About");write("featured-works/index.json",{items:[]});
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
