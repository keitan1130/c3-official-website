import fs from "node:fs";
import path from "node:path";

const SLUG = process.argv[2];
if (!SLUG || !/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(SLUG)) throw new Error("Usage: npm run new:news -- YYYY-MM-DD-readable-slug");
const DIRECTORY = path.join("content/news", SLUG);
if (fs.existsSync(DIRECTORY)) throw new Error("An article with this folder name already exists");
const DATE = `${SLUG.slice(0,10)}T12:00:00+09:00`;
if (!Number.isFinite(Date.parse(DATE)) || new Date(DATE).toISOString().slice(0,10) !== SLUG.slice(0,10)) throw new Error("Invalid publication date");
fs.mkdirSync(path.join(DIRECTORY,"assets"),{recursive:true});
fs.writeFileSync(path.join(DIRECTORY,"index.json"), JSON.stringify({id:SLUG,title:"新しいお知らせ",digest:"概要を記入してください。",createdAt:DATE,updatedAt:DATE,body:"./body.md",thumbnail:"./assets/cover.webp",authorIds:[]},null,2)+"\n");
fs.writeFileSync(path.join(DIRECTORY,"body.md"),"# 新しいお知らせ\n\n本文を記入してください。画像は同じフォルダの assets/ に置きます。\n");
fs.copyFileSync("src/assets/c3-logo.webp",path.join(DIRECTORY,"assets/cover.webp"));
console.log(`Created news: ${DIRECTORY}. Edit the thumbnail, metadata and body before committing; every news folder is published.`);
