import { NextRequest, NextResponse } from "next/server";

async function ownerToken(secret:string){ const encoder=new TextEncoder(); const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]); const signature=await crypto.subtle.sign("HMAC",key,encoder.encode("recover-owner-session-v1")); return Array.from(new Uint8Array(signature)).map(x=>x.toString(16).padStart(2,"0")).join(""); }

export async function middleware(request:NextRequest){
  if(request.nextUrl.pathname==="/owner/login") return NextResponse.next();
  const password=process.env.OWNER_DASHBOARD_PASSWORD; const secret=process.env.OWNER_SESSION_SECRET;
  if(!password||!secret){ const url=new URL("/owner/login",request.url); url.searchParams.set("setup","required"); return NextResponse.redirect(url); }
  const expected=await ownerToken(secret); const actual=request.cookies.get("recover_owner")?.value;
  if(!actual||actual!==expected){ const url=new URL("/owner/login",request.url); url.searchParams.set("next",request.nextUrl.pathname); return NextResponse.redirect(url); }
  return NextResponse.next();
}
export const config={matcher:["/owner/:path*"]};
