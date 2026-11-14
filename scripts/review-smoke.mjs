// Run against Vite with fixture environment settings; all API traffic is intercepted.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const thumbnail = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="gray"/></svg>');
const uuid = index => `fac206ed-32a0-4fdb-b3e8-${String(index).padStart(12,"0")}`;
const toyboxBlogs = Array.from({length:45},(_,index)=>({id:uuid(index),title:`Toybox ${index}`,body_text:"## Fixture body\n\nAvailable",created_at:new Date(Date.UTC(2026,0,1)-index*86400000).toISOString(),updated_at:"2026-01-01T00:00:00Z",thumbnail:{url:thumbnail},tags:[],user:{id:"external-author",name:"Fixture author"}}));
const contentfulBlogs = Array.from({length:105},(_,index)=>({sys:{id:`cf${index}`,createdAt:new Date(Date.UTC(2026,0,2)-index*86400000).toISOString(),updatedAt:"2026-01-02T00:00:00Z"},fields:{title:`Contentful ${index}`,body:"## Fixture body",digest:"Summary",user:[],tags:[]}}));
let isContentfulUnavailable=false, isToyboxUnavailable=false;
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[], requests=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{if(message.type()==="error" && /same key/.test(message.text()))errors.push(message.text());});
 await page.route(/cdn\.contentful\.com/,route=>{
  const url=new URL(route.request().url());requests.push(url);
  if(isContentfulUnavailable)return route.fulfill({status:503,json:{}});
  if(url.searchParams.get("content_type")==="user")return route.fulfill({json:{items:[{sys:{id:"author1"},fields:{name:"Fixture profile"}}],total:1}});
  const id=url.searchParams.get("sys.id"), skip=Number(url.searchParams.get("skip")??0), limit=Number(url.searchParams.get("limit")??100);
  const found=id?contentfulBlogs.filter(item=>item.sys.id===id):contentfulBlogs;
  const items=found.slice(skip,skip+limit).map(item=>url.searchParams.has("select")?{...item,fields:{...item.fields,body:undefined}}:item);
  return route.fulfill({json:{items,total:found.length}});
 });
 await page.route("**/api/v1/blogs**",route=>{
  const url=new URL(route.request().url());requests.push(url);
  if(isToyboxUnavailable)return route.fulfill({status:503,json:{}});
  if(url.pathname.endsWith("/blogs")) {
   assert.equal(url.searchParams.get("disable_pagination"),"true");
   assert.equal(url.searchParams.has("page"),false);
   return route.fulfill({json:{blogs:toyboxBlogs,blogs_total_count:toyboxBlogs.length}});
  }
  const blog=toyboxBlogs.find(item=>item.id===url.pathname.split("/").at(-1));
  return blog?route.fulfill({json:blog}):route.fulfill({status:404,json:{}});
 });
 await page.route(/\/works(?:\?|$)/,route=>route.fulfill({json:{works:[]}}));
 for(const [id,title] of [["cf0","Contentful 0"],[uuid(0),"Toybox 0"]]) {
  requests.length=0;
  await page.goto(`${BASE}/blog/${id}`);
  await page.getByRole("heading",{name:title,exact:true}).waitFor();
  await page.getByRole("heading",{name:"Fixture body",exact:true}).waitFor();
  const canonical=await page.locator('link[rel="canonical"]').getAttribute("href");
  assert.ok(canonical.endsWith(`/blog/${id}`));
  if(process.env.TEST_CANONICAL_ORIGIN)assert.equal(new URL(canonical).origin,process.env.TEST_CANONICAL_ORIGIN);
  assert.equal(await page.locator('a[href*="source="]').count(),0);
  const article=await page.getByRole("article").boundingBox(), recent=await page.getByRole("complementary").boundingBox();
  assert.ok(recent.y>=article.y+article.height);
  if(id.startsWith("cf"))assert.ok(!requests.some(url=>url.pathname.endsWith(`/blogs/${id}`)));
  else assert.ok(!requests.some(url=>url.searchParams.get("sys.id")===id));
 }
 await page.goto(BASE+"/blog");
 await page.waitForFunction(()=>document.querySelectorAll("article").length===150);
 assert.equal(await page.getByRole("button",{name:"もっと見る",exact:true}).count(),0);
 assert.ok(requests.filter(url=>url.searchParams.get("content_type")==="blog"&&!url.searchParams.has("sys.id")).every(url=>url.searchParams.get("select")&&!url.searchParams.get("select").includes("fields.body")));
 await page.goto(BASE+"/author/author1");
 await page.waitForFunction(()=>document.querySelectorAll("article").length===105);
 requests.length=0;
 await page.goto(BASE+"/");
 await page.getByRole("region",{name:"最新のブログ"}).waitFor();
 assert.equal(await page.getByRole("region",{name:"最新のブログ"}).getByRole("button",{name:/のスライド[0-9]+を表示/}).count(),5);
 assert.ok(requests.some(url=>url.searchParams.get("skip")==="100"));
 const checks=await page.evaluate(async({existing,missing})=>{
  const {getBlog,getBlogs}=await import("/src/util/blogRepository.ts");
  const found=await getBlog(existing);
  return {source:found?.source,missing:(await getBlog(missing))===undefined,contentfulMissing:(await getBlog("missing"))===undefined,count:(await getBlogs()).entries.length};
 },{existing:uuid(0),missing:uuid(99)});
 assert.deepEqual(checks,{source:"toybox",missing:true,contentfulMissing:true,count:150});
 isContentfulUnavailable=true;
 const partial=await page.evaluate(async()=>{
  const {getBlog,getBlogs}=await import("/src/util/blogRepository.ts");
  const list=await getBlogs();let hasError=false;
  try{await getBlog("cf0");}catch{hasError=true;}
  return {count:list.entries.length,unavailable:list.unavailableSources,hasError};
 });
 assert.deepEqual(partial,{count:45,unavailable:["Contentful"],hasError:true});
 isToyboxUnavailable=true;
 await page.goto(BASE+"/blog");
 await page.getByText("ブログを読み込めませんでした。",{exact:false}).waitFor();
 isContentfulUnavailable=false;isToyboxUnavailable=false;
 await page.getByRole("button",{name:"再試行",exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll("article").length===150);
 await page.goto(BASE+"/missing-static-page");
 await page.getByRole("heading",{name:"404",exact:true}).waitFor();
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex");
 await page.getByRole("link",{name:"ホームへ戻る"}).click();
 await page.getByRole("heading",{name:"Composite Computer Club"}).waitFor();
 assert.equal(await page.locator('meta[name="robots"]').count(),0);
 await page.goto(BASE+`/blog/${uuid(99)}`);
 await page.getByRole("heading",{name:"404",exact:true}).waitFor();
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex");
 await page.goto(BASE+"/about");
 await page.locator('[class*="markdown-preview"]').waitFor();
 await page.evaluate(()=>window.scrollTo({top:420,behavior:"instant"}));
 await page.waitForFunction(()=>document.querySelector("header").hasAttribute("data-hidden"));
 await page.evaluate(()=>window.scrollTo({top:400,behavior:"instant"}));
 await page.waitForFunction(()=>!document.querySelector("header").hasAttribute("data-hidden"));
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
 await page.keyboard.press("Enter");await page.keyboard.press("Escape");
 assert.equal(await page.getByRole("button",{name:"メニューを開く"}).evaluate(element=>element===document.activeElement),true);
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:1000});
  await page.goto(BASE+"/about");
  await page.locator('[class*="markdown-preview"]').waitFor();
  await page.evaluate(()=>window.scrollTo({top:600,behavior:"instant"}));
  await page.waitForFunction(()=>document.querySelector("header").hasAttribute("data-hidden"));
  await page.evaluate(()=>window.scrollTo({top:550,behavior:"instant"}));
  await page.waitForFunction(()=>!document.querySelector("header").hasAttribute("data-hidden"));
  await page.getByRole("button",{name:"メニューを開く"}).click();
  await page.getByRole("link",{name:"お知らせ",exact:true}).click();
  await page.getByRole("heading",{name:"お知らせ",exact:true,level:1}).waitFor();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute("data-scroll-locked"));
  assert.equal(await page.evaluate(()=>scrollY),0);
 }
 await page.clock.install();
 await page.goto(BASE+"/");
 const carousel=page.getByRole("region",{name:"重要なお知らせ",exact:true});
 await carousel.waitFor();
 await page.mouse.move(0,900);
 await carousel.getByRole("button",{name:"自動切替を停止",exact:true}).focus();
 await page.keyboard.press("Enter");
 await carousel.getByRole("button",{name:"自動切替を再開",exact:true}).waitFor();
 await page.keyboard.press("Tab");
 const pausedSlide=await carousel.getByRole("link").getAttribute("href");
 await page.clock.runFor(5100);
 assert.equal(await carousel.getByRole("link").getAttribute("href"),pausedSlide);
 await carousel.hover();
 await page.mouse.move(0,900);
 await page.clock.runFor(5100);
 assert.equal(await carousel.getByRole("link").getAttribute("href"),pausedSlide);
 await carousel.getByRole("button",{name:"自動切替を再開",exact:true}).focus();
 await page.keyboard.press("Enter");
 await page.clock.runFor(5100);
 assert.equal(await carousel.getByRole("link").getAttribute("href"),pausedSlide);
 await page.keyboard.press("Tab");
 await page.clock.runFor(5100);
 assert.notEqual(await carousel.getByRole("link").getAttribute("href"),pausedSlide);
 assert.deepEqual(errors,[]);
 console.log("Verified ID-only blog URLs, UUID routing, lists without Contentful bodies, all blog/author entries, partial/full failures and retry, noindex recovery, menu scroll restoration/navigation and persistent carousel pause (API fixtures).");
} finally {await browser.close();}
