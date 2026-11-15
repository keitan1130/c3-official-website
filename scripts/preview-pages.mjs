// Local model of the generated Pages static routes; not a Cloudflare runtime emulator.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const ROOT=path.resolve("dist");
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".json":"application/json",".xml":"application/xml",".txt":"text/plain",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".gif":"image/gif",".ico":"image/x-icon",".webm":"video/webm",".mp4":"video/mp4",".woff2":"font/woff2"};
const fileExists=async file=>{try{return (await fs.stat(file)).isFile();}catch{return false;}};
http.createServer(async(request,response)=>{
 try {
  const pathname=decodeURIComponent(new URL(request.url,"http://localhost").pathname);
  let file=path.resolve(ROOT,"."+(pathname==="/"?"/index.html":pathname));
  if(!file.startsWith(ROOT+path.sep)){response.writeHead(400);return response.end();}
  let status=200;
  if(!await fileExists(file)){
    if(await fileExists(file+".html"))file+=".html";
    else if(/^\/(?:blog|author)\/[^/]+\/?$/.test(pathname))file=path.join(ROOT,"index.html");
    else {file=path.join(ROOT,"404.html");status=404;}
  }
  const body=await fs.readFile(file);
  response.writeHead(status,{"Content-Type":TYPES[path.extname(file)]??"application/octet-stream","X-Content-Type-Options":"nosniff"});
  response.end(request.method==="HEAD"?undefined:body);
 } catch {response.writeHead(400);response.end("Invalid request");}
}).listen(Number(process.env.PORT ?? 4173),"127.0.0.1",()=>console.log("Pages static routing preview: http://127.0.0.1:4173"));
