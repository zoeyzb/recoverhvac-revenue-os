import http from "node:http";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const required=name=>{const value=process.env[name];if(!value)throw new Error(`${name} is required`);return value};
const api=()=>required("RECOVER_API_URL").replace(/\/$/,"");
const secret=()=>required("AUDIT_RUNNER_SECRET");
const safeUrl=value=>{const url=new URL(value);if(url.protocol!=="https:")throw new Error("Only public HTTPS targets are allowed");return url.toString()};

export async function runAudit(job){
  const chrome=await launch({chromeFlags:["--headless","--no-sandbox","--disable-dev-shm-usage"]});
  try{
    const result=await lighthouse(safeUrl(job.requested_url),{port:chrome.port,output:"json",logLevel:"error",onlyCategories:["performance","accessibility","best-practices","seo"]});
    if(!result?.lhr)throw new Error("Lighthouse returned no report");
    const lhr=result.lhr;
    return {final_url:lhr.finalDisplayedUrl,lighthouse:{version:lhr.lighthouseVersion,fetchTime:lhr.fetchTime,categories:Object.fromEntries(Object.entries(lhr.categories).map(([key,value])=>[key,{score:value.score,title:value.title}]))},evidence:Object.values(lhr.audits).filter(a=>a.score!==null&&a.score<1).slice(0,40).map(a=>({kind:"lighthouse",label:a.title,source_url:lhr.finalDisplayedUrl,value:{id:a.id,score:a.score,displayValue:a.displayValue||null,description:a.description}}))};
  } finally {await chrome.kill();}
}

async function tick(){
  const claim=await fetch(`${api()}/api/internal/audits/claim`,{method:"POST",headers:{authorization:`Bearer ${secret()}`}});
  if(claim.status===204)return;
  if(!claim.ok)throw new Error(`Claim failed (${claim.status})`);
  const {data:job}=await claim.json();
  try{const result=await runAudit(job);await fetch(`${api()}/api/internal/audits/${job.id}/complete`,{method:"POST",headers:{authorization:`Bearer ${secret()}`,"content-type":"application/json"},body:JSON.stringify(result)});}
  catch(error){await fetch(`${api()}/api/internal/audits/${job.id}/fail`,{method:"POST",headers:{authorization:`Bearer ${secret()}`,"content-type":"application/json"},body:JSON.stringify({error:error instanceof Error?error.message:"Audit failed"})});}
}

if(process.env.NODE_ENV!=="test")http.createServer(async(req,res)=>{if(req.url==="/health"){res.end("ok");return}if(req.method==="POST"&&req.url==="/run"){if(req.headers.authorization!==`Bearer ${secret()}`){res.statusCode=401;res.end("unauthorized");return}try{await tick();res.statusCode=202;res.end("accepted")}catch(error){res.statusCode=503;res.end(error instanceof Error?error.message:"failed")}return}res.statusCode=404;res.end("not found")}).listen(Number(process.env.PORT)||8080);
