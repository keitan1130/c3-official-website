import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
const BASE=process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser=await chromium.launch({headless:true});
try {
 await fs.mkdir("migration/ui-candidate",{recursive:true});
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:"light",reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(BASE);
  await page.getByRole("heading",{name:"Composite Computer Club",level:1}).waitFor();
  await page.getByText("ブログを読み込み中…",{exact:true}).waitFor({state:"hidden"});
  assert.equal(await page.getByRole("alert").count(),0);
  assert.equal(await page.locator("video").count(),5);
  await page.waitForFunction(()=>[...document.querySelectorAll('video')].every(video=>video.readyState>=1));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
  const carousel=page.getByRole("region",{name:"重要なお知らせ",exact:true});
  const previous=await carousel.getByRole("link").getAttribute("href");
  await page.getByRole("button",{name:"重要なお知らせの次のスライド",exact:true}).click();
  assert.notEqual(await carousel.getByRole("link").getAttribute("href"),previous);
  await page.screenshot({path:`migration/ui-candidate/home-${width}.png`,fullPage:true});
  if(width<1000)await page.getByRole("button",{name:"メニューを開く"}).click();
  await page.getByRole("button",{name:"ダークモードに切り替え"}).click();
  if(width<1000)await page.keyboard.press("Escape");
  assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
  await page.screenshot({path:`migration/ui-candidate/home-dark-${width}.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  await page.close();
 }
 // A failed external blog must not prevent static sections or featured works.
 const page=await browser.newPage();
 await page.route(/cdn\.contentful\.com|\/api\/toybox/,route=>route.abort());
 await page.goto(BASE);
 await page.getByText("ブログを読み込めませんでした。",{exact:false}).waitFor();
 await page.getByRole("heading",{name:"C3について",exact:true}).waitFor();
 await page.getByRole("link",{name:"作品を見る",exact:false}).waitFor();
 await page.close();
 console.log('Home: 390/768/1440 light+dark, 5 videos, carousel navigation and blog failure isolation passed.');
}finally{await browser.close();}
