import { NextResponse } from "next/server";
import { OWNER_COOKIE } from "@/lib/owner-auth";
export async function POST(){ const response=NextResponse.json({ok:true}); response.cookies.set(OWNER_COOKIE,"",{httpOnly:true,path:"/",maxAge:0}); return response; }
