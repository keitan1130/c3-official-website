import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root="dist";
const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>new URL(match[1]));
for(const url of urls){
 const file=url.pathname==="/"?"dist/index.html":path.join(root,url.pathname.slice(1)+".html");
 const html=fs.readFileSync(file,"utf8");
 assert.match(html,/<meta property="og:title" content="[^\"]+"/);
 assert.match(html,/<link rel="canonical"/);
 const image=new URL(html.match(/<meta property="og:image" content="([^\"]+)"/)[1]);
 assert.ok(fs.existsSync(path.join(root,image.pathname)));
}
assert.equal(urls.length,25);
assert.ok(!sitemap.includes('/contact'));
assert.ok(!sitemap.includes('5Ay58j7CHdYFqKShRbr5tD'));
assert.match(fs.readFileSync("dist/404.html","utf8"),/noindex/);
console.log(`Verified ${urls.length} static HTML metadata documents, local OGP images and removed-route exclusions. Dynamic author/blog initial OGP is pending.`);
