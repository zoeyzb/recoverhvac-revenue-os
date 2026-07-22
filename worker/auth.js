const roles=new Set(["owner","admin","operator","viewer"]);
export const OWNER_COOKIE="recover_owner";

export function validRole(value){return roles.has(String(value||""));}

export function cookieValue(header,name){
  for(const part of String(header||"").split(";")){
    const [key,...rest]=part.trim().split("=");
    if(key===name)return decodeURIComponent(rest.join("="));
  }
  return "";
}

function cookie(name,value,maxAge){
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.max(0,Math.floor(maxAge))}; HttpOnly; Secure; SameSite=Lax`;
}

const encoder=new TextEncoder();
const hex=(bytes)=>Array.from(new Uint8Array(bytes)).map(value=>value.toString(16).padStart(2,"0")).join("");

async function digest(value){return new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(value)));}

function equalBytes(left,right){
  if(left.length!==right.length)return false;
  let difference=0;
  for(let index=0;index<left.length;index+=1)difference|=left[index]^right[index];
  return difference===0;
}

export function ownerAuthConfigured(env){return Boolean(env.OWNER_DASHBOARD_PASSWORD&&env.OWNER_SESSION_SECRET);}

export async function validOwnerPassword(candidate,env){
  if(!ownerAuthConfigured(env)||!candidate)return false;
  const [supplied,expected]=await Promise.all([digest(String(candidate)),digest(String(env.OWNER_DASHBOARD_PASSWORD))]);
  return equalBytes(supplied,expected);
}

export async function ownerSessionToken(env){
  if(!ownerAuthConfigured(env))return "";
  const key=await crypto.subtle.importKey("raw",encoder.encode(env.OWNER_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",key,encoder.encode("recover-owner-session-v1")));
}

export async function validOwnerSession(request,env){
  const actual=cookieValue(request.headers.get("cookie"),OWNER_COOKIE);
  const expected=await ownerSessionToken(env);
  if(!actual||!expected)return false;
  return equalBytes(encoder.encode(actual),encoder.encode(expected));
}

export async function ownerSessionCookie(env){return cookie(OWNER_COOKIE,await ownerSessionToken(env),60*60*12);}
export function clearOwnerSessionCookie(){return cookie(OWNER_COOKIE,"",0);}

export function sessionCookies(session){
  return [cookie("recover_access",session.access_token,Number(session.expires_in)||3600),cookie("recover_refresh",session.refresh_token,60*60*24*30)];
}

export function clearSessionCookies(){return [cookie("recover_access","",0),cookie("recover_refresh","",0)];}

function authBase(env){
  if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.NEXT_PUBLIC_SUPABASE_ANON_KEY)throw new Error("Authentication is not configured");
  return env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,"");
}

export async function passwordLogin(email,password,env){
  const response=await fetch(`${authBase(env)}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,"content-type":"application/json"},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(response.status===400?"Invalid email or password":`Authentication failed (${response.status})`);
  const session=await response.json();if(!session.access_token||!session.refresh_token)throw new Error("Authentication returned an invalid session");return session;
}

export async function refreshSession(refreshToken,env){
  if(!refreshToken)throw new Error("Refresh session is missing");
  const response=await fetch(`${authBase(env)}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,"content-type":"application/json"},body:JSON.stringify({refresh_token:refreshToken}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error("Session expired");const session=await response.json();if(!session.access_token||!session.refresh_token)throw new Error("Refresh returned an invalid session");return session;
}

export async function resolveContext(request,env,allowedRoles=["owner","admin","operator","viewer"]){
  const access=cookieValue(request.headers.get("cookie"),"recover_access");if(!access)throw new Error("AUTH_REQUIRED");
  const base=authBase(env),userResponse=await fetch(`${base}/auth/v1/user`,{headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,authorization:`Bearer ${access}`},signal:AbortSignal.timeout(8000)});
  if(!userResponse.ok)throw new Error("AUTH_REQUIRED");const user=await userResponse.json();if(!user.id)throw new Error("AUTH_REQUIRED");
  if(!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error("AUTH_NOT_CONFIGURED");
  const requested=request.headers.get("x-organization-id")||"";
  const query=new URLSearchParams({user_id:`eq.${user.id}`,select:"organization_id,role,organizations(id,name,timezone,communication_mode)",order:"created_at.asc"});
  const membershipsResponse=await fetch(`${base}/rest/v1/organization_members?${query}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(8000)});
  if(!membershipsResponse.ok)throw new Error("MEMBERSHIP_LOOKUP_FAILED");const memberships=await membershipsResponse.json();
  const membership=requested?memberships.find(item=>item.organization_id===requested):memberships[0];
  if(!membership||!validRole(membership.role)||!allowedRoles.includes(membership.role))throw new Error("FORBIDDEN");
  return{user:{id:user.id,email:user.email||null},tenantId:membership.organization_id,role:membership.role,organization:membership.organizations};
}
