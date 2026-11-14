import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const prepareScript = fileURLToPath(new URL("./prepare-pages.mjs", import.meta.url));
const verifyScript = fileURLToPath(new URL("./verify-pages.mjs", import.meta.url));

test("static pages follow current published content rather than a fixed page count", () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"c3-pages-"));
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==="string"?value:JSON.stringify(value));};
 try {
  fs.mkdirSync(path.join(root,"content/communities"),{recursive:true});
  write("content/site/index.json",{title:"Fixture site",description:"Description",canonicalOrigin:"https://example.com"});
  write("content/about/index.json",{title:"About",summary:"About summary"});
  write("content/news/published/index.json",{id:"published",title:'A "quoted" title',digest:"News & details",thumbnail:"./assets/cover.png",isPublished:true});
  write("content/news/published/assets/cover.png","image");
  write("content/news/draft/index.json",{id:"draft",isPublished:false,thumbnail:"./assets/missing.png"});
  write("src/assets/c3-logo.webp","logo");
  const build=()=>{
   write("dist/index.html",'<html><head><title>Fixture</title></head><body></body></html>');
   execFileSync(process.execPath,[prepareScript],{cwd:root,env:{...process.env,SITE_URL:"https://example.com"}});
   execFileSync(process.execPath,[verifyScript],{cwd:root});
  };
  build();
  assert.match(fs.readFileSync(path.join(root,"dist/news/published.html"),"utf8"),/A &quot;quoted&quot; title/);
  assert.ok(!fs.existsSync(path.join(root,"dist/news/draft.html")));
  write("content/communities/new/index.json",{slug:"new",name:"New",domain:"New field"});
  build();
  assert.ok(fs.existsSync(path.join(root,"dist/community/new.html")));
  assert.match(fs.readFileSync(path.join(root,"dist/sitemap.xml"),"utf8"),/\/community\/new/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
