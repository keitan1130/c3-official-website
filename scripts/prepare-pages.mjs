import fs from "node:fs";
import path from "node:path";
const read=(file)=>JSON.parse(fs.readFileSync(file,"utf8"));
const site=read("content/site/index.json");
const origin=new URL(process.env.SITE_URL || site.canonicalOrigin).origin;
const template=fs.readFileSync("dist/index.html","utf8");
const escape=(text)=>String(text).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const metadata=(title,description,url,image="/ogp/site.webp",isError=false)=>template.replace(/<title>[^<]*<\/title>/,`<title>${escape(`${title} | C3`)}</title>`).replace(/<meta name="description"[^>]*\/?\s*>/g,"").replace("</head>",`<meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${escape(new URL(image,origin).href)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${escape(url)}">${isError?'<meta name="robots" content="noindex">':""}</head>`);
const routes=[];
function emit(route,title,description,image){const file=route==="/"?"dist/index.html":path.join("dist",route.slice(1)+".html");fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,metadata(title,description,origin+route,image));routes.push(route);}
fs.mkdirSync("dist/ogp",{recursive:true});fs.copyFileSync("src/assets/c3-logo.webp","dist/ogp/site.webp");
emit("/",site.title,site.description);
const about=read("content/about/index.json");emit("/about",about.title,about.summary);
emit("/news","お知らせ",site.description);emit("/blog","ブログ",site.description);
for(const name of fs.readdirSync("content/communities")){const directory=path.join("content/communities",name);if(!fs.statSync(directory).isDirectory())continue;const item=read(path.join(directory,"index.json"));emit(`/community/${item.slug}`,item.name,item.domain);}
for(const name of fs.readdirSync("content/news")){const directory=path.join("content/news",name);if(!fs.statSync(directory).isDirectory())continue;const item=read(path.join(directory,"index.json"));if(!item.isPublished)continue;const source=path.resolve(directory,item.thumbnail);if(!source.startsWith(path.resolve(directory)+path.sep))throw new Error("Invalid thumbnail path");const image=`/ogp/news/${item.id}${path.extname(source)}`;fs.mkdirSync("dist/ogp/news",{recursive:true});fs.copyFileSync(source,"dist"+image);emit(`/news/${item.id}`,item.title,item.digest,image);}
fs.writeFileSync("dist/404.html",metadata("404","ページが見つかりません。",origin+"/404",undefined,true));
fs.writeFileSync("dist/_redirects","/blog/* /index.html 200\n/author/* /index.html 200\n");
fs.writeFileSync("dist/robots.txt",`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync("dist/sitemap.xml",`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${escape(origin+route)}</loc></url>`).join("")}</urlset>\n`);
console.log(`Prepared ${routes.length} route HTML documents, initial OGP, 404, sitemap and Pages dynamic-route fallbacks.`);
