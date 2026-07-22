import { NextResponse } from "next/server";
import { accountEnvironment, authError, normalizedEmail, organizationContext, validRequestOrigin } from "@/lib/account-auth";
export async function POST(request: Request) {
  try {
    if(!validRequestOrigin(request)) return NextResponse.json({error:{code:"ORIGIN_REJECTED",message:"Request origin was rejected"}},{status:403});
    const body=await request.json().catch(()=>({})); const email=normalizedEmail(body.email); const password=String(body.password||"");
    if(password.length<8||password.length>256) return NextResponse.json({error:{code:"VALIDATION_ERROR",message:"Enter your password"}},{status:422});
    const env=accountEnvironment();
    const response=await fetch(`${env.base}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:env.anon,"content-type":"application/json"},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(10000)});
    if(!response.ok) return NextResponse.json({error:{code:"LOGIN_FAILED",message:await authError(response,"Invalid email or password")}},{status:401});
    const session=await response.json(); const context=await organizationContext(session.access_token,env); const result=NextResponse.json({data:context});
    result.cookies.set("recover_access",session.access_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:Number(session.expires_in)||3600});
    result.cookies.set("recover_refresh",session.refresh_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:2592000}); return result;
  } catch(error) { const message=error instanceof Error?error.message:"Sign in failed"; const status=message==="AUTH_NOT_CONFIGURED"?503:message==="FORBIDDEN"?403:422; return NextResponse.json({error:{code:message,message:message==="AUTH_NOT_CONFIGURED"?"Account login is not configured yet":message==="FORBIDDEN"?"This account has no Recover workspace":message}},{status}); }
}
