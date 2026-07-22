export type AccountEnvironment = { base: string; anon: string; service: string };

export function accountEnvironment(): AccountEnvironment {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base || !anon || !service) throw new Error("AUTH_NOT_CONFIGURED");
  return { base, anon, service };
}

export function normalizedEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Enter a valid email address");
  return email;
}

export function validRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function authError(response: Response, fallback: string) {
  if (response.status >= 500) return "Sign in is temporarily unavailable. Please try again.";
  if (!(response.headers.get("content-type") || "").includes("application/json")) return fallback;
  try {
    const payload = await response.json();
    const message = String(payload?.msg || payload?.message || payload?.error_description || "");
    if (/already registered|already exists/i.test(message)) return "An account already exists for this email. Sign in instead.";
    if (/invalid.*login|invalid.*credentials/i.test(message)) return "Invalid email or password";
    return message && message.length < 180 ? message : fallback;
  } catch { return fallback; }
}

const serviceHeaders = (env: AccountEnvironment, extra: Record<string,string> = {}) => ({ apikey: env.service, authorization: `Bearer ${env.service}`, "content-type": "application/json", ...extra });

export async function organizationContext(access: string, env: AccountEnvironment) {
  const userResponse = await fetch(`${env.base}/auth/v1/user`, { headers: { apikey: env.anon, authorization: `Bearer ${access}` }, signal: AbortSignal.timeout(8000) });
  if (!userResponse.ok) throw new Error("AUTH_REQUIRED");
  const user = await userResponse.json();
  const query = new URLSearchParams({ user_id: `eq.${user.id}`, select: "organization_id,role,organizations(id,name,timezone,communication_mode)", order: "created_at.asc", limit: "1" });
  const membershipResponse = await fetch(`${env.base}/rest/v1/organization_members?${query}`, { headers: serviceHeaders(env), signal: AbortSignal.timeout(8000) });
  if (!membershipResponse.ok) throw new Error("MEMBERSHIP_LOOKUP_FAILED");
  const membership = (await membershipResponse.json())?.[0];
  if (!membership) throw new Error("FORBIDDEN");
  return { user: { id: user.id, email: user.email || null }, role: membership.role, organization: membership.organizations };
}

export async function createAccount(input: { businessName: string; email: string; password: string; timezone: string }, env: AccountEnvironment) {
  const signup = await fetch(`${env.base}/auth/v1/signup`, { method: "POST", headers: { apikey: env.anon, "content-type": "application/json" }, body: JSON.stringify({ email: input.email, password: input.password, data: { business_name: input.businessName } }), signal: AbortSignal.timeout(10000) });
  if (!signup.ok) throw new Error(await authError(signup, "Could not create your account"));
  const session = await signup.json();
  if (!session?.user?.id) throw new Error("Account creation returned an invalid user");
  if (Array.isArray(session.user.identities) && session.user.identities.length === 0) throw new Error("An account already exists for this email. Sign in instead.");
  let organizationId = "";
  try {
    const orgResponse = await fetch(`${env.base}/rest/v1/organizations?select=id,name,timezone,communication_mode`, { method: "POST", headers: serviceHeaders(env, { prefer: "return=representation" }), body: JSON.stringify({ name: input.businessName, timezone: input.timezone, communication_mode: "test" }), signal: AbortSignal.timeout(8000) });
    if (!orgResponse.ok) throw new Error("Could not create your workspace");
    const organization = (await orgResponse.json())?.[0];
    if (!organization?.id) throw new Error("Could not create your workspace");
    organizationId = organization.id;
    for (const [path, body] of [
      ["organization_members", { organization_id: organization.id, user_id: session.user.id, role: "owner" }],
      ["automation_settings", { tenant_id: organization.id, master_enabled: false, approval_mode: "first_touch" }],
    ] as const) {
      const response = await fetch(`${env.base}/rest/v1/${path}`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Could not initialize your workspace");
    }
    const templates = await fetch(`${env.base}/rest/v1/rpc/seed_recovery_templates`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify({ target: organization.id }), signal: AbortSignal.timeout(8000) });
    if (!templates.ok) throw new Error("Could not install workflow templates");
    return { session, organization };
  } catch (error) {
    if (organizationId) await fetch(`${env.base}/rest/v1/organizations?id=eq.${encodeURIComponent(organizationId)}`, { method: "DELETE", headers: serviceHeaders(env) }).catch(() => undefined);
    await fetch(`${env.base}/auth/v1/admin/users/${encodeURIComponent(session.user.id)}`, { method: "DELETE", headers: serviceHeaders(env) }).catch(() => undefined);
    throw error;
  }
}
