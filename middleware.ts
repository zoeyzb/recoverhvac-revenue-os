import { NextRequest, NextResponse } from "next/server";

async function digest(value:string){ const bytes=new TextEncoder().encode(value); const hash=await crypto.subtle.digest("SHA-256",bytes); return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join(""); }

export async function middleware(request:NextRequest){
  if(request.nextUrl.pathname==="/owner/login") return NextResponse.next();
  const password=process.env.OWNER_DASHBOARD_PASSWORD; const secret=process.env.OWNER_SESSION_SECRET;
  if(!password||!secret){ const url=new URL("/owner/login",request.url); url.searchParams.set("setup","required"); return NextResponse.redirect(url); }
  const expected=await digest(`${password}:${secret}`); const actual=request.cookies.get("recover_owner")?.value;
  if(!actual||actual!==expected){ const url=new URL("/owner/login",request.url); url.searchParams.set("next",request.nextUrl.pathname); return NextResponse.redirect(url); }
  return NextResponse.next();
}
export const config={matcher:["/owner/:path*"]};
