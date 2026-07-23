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
    const message = String(payload?.msg || payload?.message || payload?.error_description || payload?.error || "");
    if (/already registered|already exists|already been registered|duplicate/i.test(message)) return "An account already exists for this email. Sign in instead.";
    if (/invalid.*login|invalid.*credentials/i.test(message)) return "Invalid email or password";
    if (/security purposes|rate limit|too many requests/i.test(message)) return message;
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
  // Public /signup responses can be intentionally ambiguous when email confirmation
  // or anti-enumeration protections are enabled. Provision the user through the
  // server-only admin endpoint so workspace creation always receives a real user ID.
  const createUserResponse = await fetch(`${env.base}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { business_name: input.businessName },
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!createUserResponse.ok) throw new Error(await authError(createUserResponse, "Could not create your account"));

  const createdPayload = await createUserResponse.json();
  const user = createdPayload?.user ?? createdPayload;
  if (!user?.id) throw new Error("Supabase did not return a valid user ID");

  let organizationId = "";
  try {
    const orgResponse = await fetch(`${env.base}/rest/v1/organizations?select=id,name,timezone,communication_mode`, {
      method: "POST",
      headers: serviceHeaders(env, { prefer: "return=representation" }),
      body: JSON.stringify({ name: input.businessName, timezone: input.timezone, communication_mode: "test" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!orgResponse.ok) throw new Error("Could not create your workspace");
    const organization = (await orgResponse.json())?.[0];
    if (!organization?.id) throw new Error("Could not create your workspace");
    organizationId = organization.id;

    for (const [path, body] of [
      ["organization_members", { organization_id: organization.id, user_id: user.id, role: "owner" }],
      ["automation_settings", { tenant_id: organization.id, master_enabled: false, approval_mode: "first_touch" }],
    ] as const) {
      const response = await fetch(`${env.base}/rest/v1/${path}`, {
        method: "POST",
        headers: serviceHeaders(env),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Could not initialize your workspace");
    }

    const templates = await fetch(`${env.base}/rest/v1/rpc/seed_recovery_templates`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify({ target: organization.id }),
      signal: AbortSignal.timeout(8000),
    });
    if (!templates.ok) throw new Error("Could not install workflow templates");

    const tokenResponse = await fetch(`${env.base}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env.anon, "content-type": "application/json" },
      body: JSON.stringify({ email: input.email, password: input.password }),
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenResponse.ok) throw new Error(await authError(tokenResponse, "Account created, but automatic sign-in failed. Sign in manually."));
    const session = await tokenResponse.json();

    return { session, organization };
  } catch (error) {
    if (organizationId) {
      await fetch(`${env.base}/rest/v1/organizations?id=eq.${encodeURIComponent(organizationId)}`, {
        method: "DELETE",
        headers: serviceHeaders(env),
      }).catch(() => undefined);
    }
    await fetch(`${env.base}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      headers: serviceHeaders(env),
    }).catch(() => undefined);
    throw error;
  }
}
