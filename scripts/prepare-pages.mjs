import fs from "node:fs";
import path from "node:path";
import { loadContent, localFile } from "./local-content.mjs";
import { SITE, PAGE_TITLES } from "../src/config/site.ts";
import { createPageMetadata } from "../src/util/pageMetadata.ts";
const { about, communities, news } = loadContent();
const origin=SITE.origin;
const template=fs.readFileSync("dist/index.html","utf8");
const escape=(text)=>String(text).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const metadata=(title,description,url,image,isError=false)=>{
  const meta=createPageMetadata({title,description,pathname:url,image});
  return template.replace(/<title>[^<]*<\/title>/,`<title>${escape(meta.title)}</title>`).replace(/<meta name="description"[^>]*\/?\s*>/g,"").replace("</head>",`<meta name="description" content="${escape(meta.description)}"><meta property="og:title" content="${escape(meta.ogTitle)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${escape(meta.url)}"><meta property="og:image" content="${escape(meta.image)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${escape(meta.url)}">${isError?'<meta name="robots" content="noindex">':""}</head>`);
};
const routes=[];
function emit(route,title,description,image){const file=route==="/"?"dist/index.html":path.join("dist",route.slice(1)+".html");fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,metadata(title,description,origin+route,image));routes.push(route);}
fs.mkdirSync(path.dirname("dist"+SITE.defaultImage),{recursive:true});fs.copyFileSync("public/favicon.png","dist"+SITE.defaultImage);
emit("/",SITE.title,SITE.description);
emit("/about",PAGE_TITLES.about,about.value.summary);
emit("/news",PAGE_TITLES.news,SITE.description);emit("/blog",PAGE_TITLES.blog,SITE.description);
for(const {value:item} of communities)emit(`/community/${item.slug}`,item.name,item.domain);
for(const {value:item,directory} of news){const source=localFile(directory,item.thumbnail);const image=`/ogp/news/${item.id}${path.extname(source)}`;fs.mkdirSync("dist/ogp/news",{recursive:true});fs.copyFileSync(source,"dist"+image);emit(`/news/${item.id}`,item.title,item.digest,image);}
fs.writeFileSync("dist/404.html",metadata("404","ページが見つかりません。",origin+"/404",undefined,true));
fs.writeFileSync("dist/_redirects","/blog/* /index.html 200\n/author/* /index.html 200\n");
fs.writeFileSync("dist/robots.txt",`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync("dist/sitemap.xml",`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${escape(origin+route)}</loc></url>`).join("")}</urlset>\n`);
console.log(`Prepared ${routes.length} route HTML documents, initial OGP, 404, sitemap and Pages dynamic-route fallbacks.`);
