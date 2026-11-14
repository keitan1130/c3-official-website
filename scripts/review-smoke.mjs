// Run against Vite with fixture environment settings; all API traffic is intercepted.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const thumbnail = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="gray"/></svg>');
const toyboxBlog = id => ({id,title:`Toybox ${id}`,body_text:"## Fixture body\n\nAvailable",created_at:"2026-01-01T00:00:00Z",updated_at:"2026-01-01T00:00:00Z",thumbnail:{url:thumbnail},tags:[],user:{id:"external-author",name:"Fixture author"}});
const contentfulBlog = {sys:{id:"shared",createdAt:"2026-01-02T00:00:00Z",updatedAt:"2026-01-02T00:00:00Z"},fields:{title:"Contentful shared",body:"## Fixture body",user:[],tags:[]}};
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{if(message.type()==="error" && /same key/.test(message.text()))errors.push(message.text());});
 await page.route(/cdn\.contentful\.com/,route=>{
  const url=new URL(route.request().url());
  if(url.searchParams.get("content_type")==="user")return route.fulfill({json:{items:[],total:0}});
  const id=url.searchParams.get("sys.id");
  if(id==="toybox-only" || id==="unavailable")return route.fulfill({status:503,json:{}});
  const items=!id || id==="shared"?[contentfulBlog]:[];
  return route.fulfill({json:{items,total:items.length}});
 });
 await page.route("**/api/v1/blogs**",route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith("/blogs"))return route.fulfill({json:{blogs:[toyboxBlog("shared"),toyboxBlog("toybox-only")]}});
  const id=url.pathname.split("/").at(-1);
  return ["shared","toybox-only"].includes(id)?route.fulfill({json:toyboxBlog(id)}):route.fulfill({status:404,json:{}});
 });
 await page.route(/\/works(?:\?|$)/,route=>route.fulfill({json:{works:[]}}));
 await page.goto(BASE+"/blog/shared?source=contentful");
 await page.getByRole("heading",{name:"Contentful shared",exact:true}).waitFor();
 await page.getByRole("complementary").getByRole("link",{name:"Toybox shared",exact:true}).waitFor();
 assert.equal(await page.getByRole("complementary").getByRole("link",{name:"Contentful shared",exact:true}).count(),0);
 const fallbacks=await page.evaluate(async()=>{
  const {getBlog}=await import("/src/util/blogRepository.ts");
  const found=await getBlog("toybox-only");
  const missing=await getBlog("missing");
  let unavailable=false;
  try {await getBlog("unavailable");} catch {unavailable=true;}
  let explicitFailed=false;
  try {await getBlog("toybox-only","contentful");} catch {explicitFailed=true;}
  return {source:found?.source,id:found?.id,missing:missing===undefined,unavailable,explicitFailed};
 });
 assert.deepEqual(fallbacks,{source:"toybox",id:"toybox-only",missing:true,unavailable:true,explicitFailed:true});
 await page.goto(BASE+"/");
 await page.getByRole("region",{name:"最新のブログ"}).waitFor();
 await page.goto(BASE+"/missing-static-page");
 await page.getByRole("heading",{name:"404",exact:true}).waitFor();
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex");
 await page.getByRole("link",{name:"ホームへ戻る"}).click();
 await page.getByRole("heading",{name:"Composite Computer Club"}).waitFor();
 assert.equal(await page.locator('meta[name="robots"]').count(),0);
 await page.goto(BASE+"/blog/missing?source=toybox");
 await page.getByRole("heading",{name:"404",exact:true}).waitFor();
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex");
 await page.goto(BASE+"/about");
 await page.locator('[class*="markdown-preview"]').waitFor();
 await page.evaluate(()=>window.scrollTo({top:400,behavior:"instant"}));
 await page.getByRole("button",{name:"メニューを開く"}).click();
 await page.waitForFunction(()=>getComputedStyle(document.body).position==="fixed");
 await page.mouse.move(1200,700);
 const locked=await page.evaluate(()=>document.body.getBoundingClientRect().top);
 await page.mouse.wheel(0,500);
 await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>document.body.getBoundingClientRect().top),locked);
 await page.keyboard.press("Escape");
 await page.waitForFunction(()=>!document.documentElement.hasAttribute("data-scroll-locked"));
 assert.ok(Math.abs(await page.evaluate(()=>scrollY)-400)<2);
 await page.getByRole("button",{name:"メニューを開く"}).focus();
 await page.keyboard.press("Enter");
 await page.keyboard.press("Escape");
 assert.equal(await page.getByRole("button",{name:"メニューを開く"}).evaluate(element=>element===document.activeElement),true);
 assert.deepEqual(errors,[]);
 console.log("Verified source-specific blog identity, fallback/error distinction, noindex recovery, carousel keys and scroll-lock restoration (API fixtures).");
} finally {await browser.close();}
