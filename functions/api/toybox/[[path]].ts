interface ProxyContext {
  request: Request;
  env: { TOYBOX_API_BASE_URL?: string };
  params: {path: string|string[]};
}
const jsonError = (message:string,status:number) => Response.json({message},{status,headers:{"Cache-Control":"no-store"}});
export const onRequest = async ({request,env,params}:ProxyContext):Promise<Response> => {
  if(request.method!=="GET")return jsonError("Method not allowed",405);
  const parts=Array.isArray(params.path)?params.path:params.path.split("/");
  if(parts[0]!=="blogs" || parts.length>2 || (parts[1] && !/^[A-Za-z0-9-]+$/.test(parts[1])))return jsonError("Not found",404);
  if(!env.TOYBOX_API_BASE_URL)return jsonError("Blog delivery is unavailable",503);
  let base:URL;
  try {base=new URL(env.TOYBOX_API_BASE_URL);}catch{return jsonError("Blog delivery is unavailable",503);}
  if(base.protocol!=="https:")return jsonError("Blog delivery is unavailable",503);
  const incoming=new URL(request.url);
  const upstream=new URL(`${base.toString().replace(/\/$/,"")}/${parts.join("/")}`);
  for(const key of ["limit","page","disable_pagination"]) {
    const value=incoming.searchParams.get(key);
    if(value!==null)upstream.searchParams.set(key,value);
  }
  try {
    const response=await fetch(upstream,{headers:{Accept:"application/json"},redirect:"error"});
    if(!response.headers.get("Content-Type")?.includes("application/json"))return jsonError("Blog delivery failed",502);
    return new Response(response.body,{status:response.status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  } catch{return jsonError("Blog delivery failed",502);}
};
