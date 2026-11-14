import assert from "node:assert/strict";
import test from "node:test";
import {onRequest} from "../functions/api/toybox/[[path]].ts";

test("public blog proxy limits routes and never forwards cookies or authorization",async(t)=>{
 const original=globalThis.fetch;
 t.after(()=>{globalThis.fetch=original;});
 const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return Response.json({blogs:[]});};
 const env={TOYBOX_API_BASE_URL:"https://legacy.example/api/v1"};
 const request=new Request("https://site.example/api/toybox/blogs?limit=5&untrusted=value",{headers:{Cookie:"session=secret",Authorization:"Bearer secret"}});
 assert.equal((await onRequest({request,env,params:{path:["blogs"]}})).status,200);
 assert.equal(calls[0].url,"https://legacy.example/api/v1/blogs?limit=5");
 assert.deepEqual(calls[0].options.headers,{Accept:"application/json"});
 assert.equal((await onRequest({request:new Request(request.url,{method:"POST"}),env,params:{path:["blogs"]}})).status,405);
 assert.equal((await onRequest({request,env,params:{path:["auth"]}})).status,404);
 assert.equal((await onRequest({request,env:{},params:{path:["blogs"]}})).status,503);
 assert.equal(calls.length,1);
});
