import assert from "node:assert/strict";
import { chromium } from "playwright";
const BASE=process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(BASE+"/blog");
 await page.getByRole("heading",{name:"ブログ",exact:true,level:1}).waitFor();
 await page.getByText("ブログを読み込み中…",{exact:true}).waitFor({state:"hidden"});
 const result=await page.evaluate(async()=>{
   const {getBlogs}=await import('/src/util/blogRepository.ts');
   const data=await getBlogs();
   return {count:data.entries.length,unavailable:data.unavailableSources,samples:["contentful","toybox"].map(source=>{const entry=data.entries.find(item=>item.source===source);return entry?{id:entry.id,title:entry.title,source}:null;})};
 });
 assert.deepEqual(result.unavailable,[]);
 assert.equal(await page.getByRole("article").count(),result.count);
 for(const sample of result.samples){
   assert.ok(sample);
   await page.goto(`${BASE}/blog/${sample.id}?source=${sample.source}`);
   await page.getByRole("heading",{name:sample.title,exact:true,level:1}).first().waitFor();
   await page.getByText("読み込み中…",{exact:true}).waitFor({state:"hidden"});
   assert.equal(await page.getByRole("alert").count(),0);
 }
 await page.route(/cdn\.contentful\.com/,route=>route.abort());
 await page.goto(BASE+"/blog");
 await page.getByText("一部のブログを取得できませんでした。",{exact:false}).waitFor();
 assert.ok(await page.getByRole("article").count()>0);
 await page.unrouteAll();
 await page.getByRole("button",{name:"再試行",exact:true}).click();
 await page.getByRole("alert").waitFor({state:"hidden"});
 await page.route(/cdn\.contentful\.com|kodomobeya/,route=>route.abort());
 await page.goto(BASE+"/blog");
 await page.getByText("ブログを読み込めませんでした。",{exact:false}).waitFor();
 await page.unrouteAll();
 await page.getByRole("button",{name:"再試行",exact:true}).click();
 await page.getByRole("article").first().waitFor();
 console.log(JSON.stringify({blogCount:result.count,bothSourceDetails:true,partialFailure:true,fullFailureAndRetry:true}));
} finally {await browser.close();}
