import { NextResponse } from "next/server";
export async function POST(){const response=NextResponse.json({data:{signedOut:true}});response.cookies.set("recover_access","",{path:"/",maxAge:0});response.cookies.set("recover_refresh","",{path:"/",maxAge:0});return response;}
