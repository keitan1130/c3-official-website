import fs from "node:fs";
import path from "node:path";

const SLUG = process.argv[2];
if (!SLUG || !/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(SLUG)) throw new Error("Usage: npm run new:news -- YYYY-MM-DD-readable-slug");
const DIRECTORY = path.join("content/news", SLUG);
if (fs.existsSync(DIRECTORY)) throw new Error("An article with this folder name already exists");
const DATE = `${SLUG.slice(0,10)}T12:00:00+09:00`;
if (!Number.isFinite(Date.parse(DATE))) throw new Error("Invalid publication date");
fs.mkdirSync(path.join(DIRECTORY,"assets"),{recursive:true});
fs.writeFileSync(path.join(DIRECTORY,"index.json"), JSON.stringify({id:SLUG,title:"新しいお知らせ",digest:"概要を記入してください。",createdAt:DATE,updatedAt:DATE,isPublished:false,important:false,body:"./body.md",thumbnail:"",authorIds:[],tagIds:[]},null,2)+"\n");
fs.writeFileSync(path.join(DIRECTORY,"body.md"),"# 新しいお知らせ\n\n本文を記入してください。画像は同じフォルダの assets/ に置きます。\n");
fs.writeFileSync(path.join(DIRECTORY,"assets/.gitkeep"),"");
console.log(`Created draft: ${DIRECTORY}. Add thumbnail, edit body and set isPublished to true when ready.`);
