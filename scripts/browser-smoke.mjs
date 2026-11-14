import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const STAGE = Number(process.argv[2] ?? "4");
const browser = await chromium.launch({headless:true});
const results = [];
try {
 for(const width of [390,1440]) {
  const page = await browser.newPage({viewport:{width,height:1000},colorScheme:"light"});
  const errors=[];
  const external=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",request=>{if(/contentful\.com|kodomobeya/.test(request.url()))external.push(request.url());});
  const routes=[["/about","C3について"],...["game","3dcg","hack","2dcg","music"].map(slug=>["/community/"+slug,slug.toUpperCase()])];

  for(const [route,title] of routes){
   await page.goto(BASE+route);
   await page.getByRole("heading",{name:title,exact:true,level:1}).waitFor();
   await page.getByText("読み込み中…",{exact:true}).waitFor({state:"hidden"});
   assert.equal(await page.getByRole("alert").count(),0,route);
   if(route.startsWith("/community/"))await page.waitForFunction(()=>document.querySelector("video")?.readyState>=1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`horizontal overflow ${route} ${width}`);
   results.push({route,width});
  }
  await page.goto(BASE+"/community/5Ay58j7CHdYFqKShRbr5tD");
  await page.getByRole("heading",{name:"404"}).waitFor();
  assert.equal(external.length,0,"Local content should not fetch external Contentful/Toybox APIs");
  assert.deepEqual(errors,[]);
  if(STAGE>=5) {
    await page.route(/cdn\.contentful\.com|kodomobeya/,route=>route.abort());
    await page.goto(BASE+"/news");
    await page.getByRole("heading",{name:"お知らせ",exact:true,level:1}).waitFor();
    assert.equal(await page.getByRole("article").count(),16);
    const directories=await fs.readdir("content/news");
    for(const directory of directories) {
      const entry=JSON.parse(await fs.readFile(`content/news/${directory}/index.json`,"utf8"));
      await page.goto(BASE+"/news/"+entry.id);
      await page.getByRole("heading",{name:entry.title,exact:true,level:1}).first().waitFor();
      await page.getByText("読み込み中…",{exact:true}).waitFor({state:"hidden"});
      assert.equal(await page.getByRole("alert").count(),0);
    }
    await page.unrouteAll();
    const id=JSON.parse(await fs.readFile(`content/news/${directories[0]}/index.json`,"utf8")).authorIds[0];
    if(id) {
      await page.goto(BASE+"/author/"+id);
      await page.getByRole("heading",{level:1}).waitFor();
      await page.getByText("ブログを読み込み中…",{exact:true}).waitFor({state:"hidden"});
      assert.equal(await page.getByRole("alert").count(),0);
    }
  }
  await page.goto(BASE+"/about");
  await page.getByText("読み込み中…",{exact:true}).waitFor({state:"hidden"});
  await fs.mkdir("test-results/pages",{recursive:true});
  await page.screenshot({path:`test-results/pages/about-${width}.png`,fullPage:true});
  await page.close();
 }
 console.log(JSON.stringify({stage:STAGE,pages:results,oldCommunityIs404:true,noLocalContentApiCalls:true}));
} finally {await browser.close();}
