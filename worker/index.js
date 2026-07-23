import { verifyStripeSignature, verifyTwilioSignature } from "./signatures.js";
import { authorizeWorker, retryDelaySeconds } from "./workflow-queue.js";
import {
  clearOwnerSessionCookie,
  clearSessionCookies,
  cookieValue,
  ownerAuthConfigured,
  ownerSessionCookie,
  passwordLogin,
  normalizeEmail,
  refreshSession,
  resolveContext,
  sessionCookies,
  signupAccount,
  validOwnerPassword,
  validOwnerSession,
} from "./auth.js";

const providers = [
  {
    id: "supabase",
    name: "Supabase",
    category: "Data & identity",
    description: "Tenant data, authentication, events and audit evidence.",
    env: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    fields: [
      {
        key: "url",
        label: "Project URL",
        secret: false,
        placeholder: "https://project.supabase.co",
      },
      {
        key: "apiKey",
        label: "Service role key",
        secret: true,
        placeholder: "eyJ…",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "Intelligence",
    description:
      "Conversation analysis, summaries, qualification and voice reasoning.",
    env: ["OPENAI_API_KEY"],
    fields: [
      { key: "apiKey", label: "API key", secret: true, placeholder: "sk-…" },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Communications",
    description: "Calls, SMS, phone numbers and signed delivery events.",
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    fields: [
      {
        key: "accountSid",
        label: "Account SID",
        secret: false,
        placeholder: "AC…",
      },
      {
        key: "authToken",
        label: "Auth token",
        secret: true,
        placeholder: "••••••••",
      },
      {
        key: "phoneNumber",
        label: "Sending phone number",
        secret: false,
        placeholder: "+13125550123",
      },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    category: "Communications",
    description: "Transactional email and verified delivery tracking.",
    env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    fields: [
      { key: "apiKey", label: "API key", secret: true, placeholder: "re_…" },
      {
        key: "fromEmail",
        label: "Verified from address",
        secret: false,
        placeholder: "service@company.com",
      },
    ],
  },
  {
    id: "twenty",
    name: "Twenty CRM",
    category: "Customer data",
    description: "Companies, contacts and opportunity pipeline.",
    env: ["TWENTY_API_URL", "TWENTY_API_KEY"],
    fields: [
      {
        key: "url",
        label: "Workspace URL",
        secret: false,
        placeholder: "https://crm.example.com",
      },
      {
        key: "apiKey",
        label: "API key",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "activepieces",
    name: "Activepieces",
    category: "Automation",
    description: "Workflow orchestration, approvals, retries and schedules.",
    env: ["ACTIVEPIECES_URL", "ACTIVEPIECES_API_KEY"],
    fields: [
      {
        key: "url",
        label: "Instance URL",
        secret: false,
        placeholder: "https://automation.example.com",
      },
      {
        key: "apiKey",
        label: "API key",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Revenue",
    description: "Payments, subscriptions, invoices and refunds.",
    env: ["STRIPE_SECRET_KEY"],
    fields: [
      {
        key: "apiKey",
        label: "Secret key",
        secret: true,
        placeholder: "sk_test_…",
      },
    ],
  },
  {
    id: "livekit",
    name: "LiveKit",
    category: "Voice infrastructure",
    description: "Realtime AI voice sessions, tools and human transfer.",
    env: [
      "LIVEKIT_URL",
      "LIVEKIT_API_KEY",
      "LIVEKIT_API_SECRET",
      "VOICE_DISPATCH_URL",
      "VOICE_DISPATCH_SECRET",
    ],
    fields: [
      {
        key: "url",
        label: "WebSocket URL",
        secret: false,
        placeholder: "wss://…",
      },
      { key: "apiKey", label: "API key", secret: false, placeholder: "API…" },
      {
        key: "apiSecret",
        label: "API secret",
        secret: true,
        placeholder: "••••••••",
      },
      {
        key: "dispatchUrl",
        label: "Voice service URL",
        secret: false,
        placeholder: "https://voice.example.com",
      },
      {
        key: "dispatchSecret",
        label: "Dispatch secret",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "posthog",
    name: "PostHog",
    category: "Product analytics",
    description: "Funnels, product events and privacy-aware session analytics.",
    env: ["NEXT_PUBLIC_POSTHOG_KEY"],
    fields: [
      {
        key: "apiKey",
        label: "Project API key",
        secret: true,
        placeholder: "phc_…",
      },
    ],
  },
  {
    id: "metabase",
    name: "Metabase",
    category: "Business intelligence",
    description: "Read-only operational, sales, cost and compliance reporting.",
    env: ["METABASE_URL", "METABASE_SECRET_KEY"],
    fields: [
      {
        key: "url",
        label: "Instance URL",
        secret: false,
        placeholder: "https://reports.example.com",
      },
      {
        key: "apiKey",
        label: "API key",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "openoutreach",
    name: "OpenOutreach",
    category: "Optional acquisition",
    description:
      "Isolated acquisition experiment only; never the core email system or automatic social messaging.",
    env: ["OPENOUTREACH_URL", "OPENOUTREACH_API_KEY"],
    fields: [
      {
        key: "url",
        label: "Isolated instance URL",
        secret: false,
        placeholder: "https://outreach.example.com",
      },
      {
        key: "apiKey",
        label: "Adapter API key",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "google-business",
    name: "Google Business Profile",
    category: "Reputation",
    description:
      "Business profile, review requests and attributable review activity.",
    env: ["GOOGLE_BUSINESS_ACCESS_TOKEN"],
    fields: [
      {
        key: "accessToken",
        label: "OAuth access token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Scheduling",
    description: "Appointment availability and confirmed booking events.",
    env: ["GOOGLE_CALENDAR_CREDENTIALS", "GOOGLE_CALENDAR_ID"],
    fields: [
      {
        key: "credentials",
        label: "Service account JSON",
        secret: true,
        placeholder: "{ … }",
      },
      {
        key: "calendarId",
        label: "Calendar ID",
        secret: false,
        placeholder: "primary or team@company.com",
      },
    ],
  },
  {
    id: "servicetitan",
    name: "ServiceTitan",
    category: "Field service",
    description: "Customers, calls, appointments, jobs and collected revenue.",
    env: ["SERVICETITAN_CLIENT_ID", "SERVICETITAN_CLIENT_SECRET"],
    fields: [
      {
        key: "clientId",
        label: "Client ID",
        secret: false,
        placeholder: "••••••••",
      },
      {
        key: "clientSecret",
        label: "Client secret",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "housecall-pro",
    name: "Housecall Pro",
    category: "Field service",
    description:
      "Customer, estimate, booking, job and payment synchronization.",
    env: ["HOUSECALL_PRO_API_KEY"],
    fields: [
      {
        key: "apiKey",
        label: "API key",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "jobber",
    name: "Jobber",
    category: "Field service",
    description:
      "Requests, clients, quotes, jobs and invoices through an approved app.",
    env: ["JOBBER_ACCESS_TOKEN"],
    fields: [
      {
        key: "accessToken",
        label: "OAuth access token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Accounting",
    description: "Invoice and payment reconciliation for confirmed revenue.",
    env: ["QUICKBOOKS_ACCESS_TOKEN"],
    fields: [
      {
        key: "accessToken",
        label: "OAuth access token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    category: "Team alerts",
    description:
      "Owner alerts, approval requests, failures and human handoffs.",
    env: ["SLACK_WEBHOOK_URL"],
    fields: [
      {
        key: "url",
        label: "Incoming webhook URL",
        secret: true,
        placeholder: "https://hooks.slack.com/…",
      },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "Customer data",
    description:
      "Contacts, companies, deals, lifecycle stages and activity sync.",
    env: ["HUBSPOT_ACCESS_TOKEN"],
    fields: [
      {
        key: "accessToken",
        label: "Private app token",
        secret: true,
        placeholder: "pat-…",
      },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "Customer data",
    description:
      "Accounts, contacts, opportunities and activity synchronization.",
    env: ["SALESFORCE_INSTANCE_URL", "SALESFORCE_ACCESS_TOKEN"],
    fields: [
      {
        key: "url",
        label: "Instance URL",
        secret: false,
        placeholder: "https://company.my.salesforce.com",
      },
      {
        key: "accessToken",
        label: "OAuth access token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "Customer data",
    description: "People, organizations, deals and activity outcomes.",
    env: ["PIPEDRIVE_API_TOKEN"],
    fields: [
      {
        key: "apiKey",
        label: "API token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Communications",
    description: "OAuth email sending, reply detection and thread history.",
    env: ["GMAIL_REFRESH_TOKEN"],
    fields: [
      {
        key: "refreshToken",
        label: "OAuth refresh token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    category: "Communications",
    description: "Microsoft Graph email, replies and shared mailbox activity.",
    env: ["MICROSOFT_REFRESH_TOKEN"],
    fields: [
      {
        key: "refreshToken",
        label: "OAuth refresh token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Scheduling",
    description: "Booking links, invitees, cancellations and meeting outcomes.",
    env: ["CALENDLY_ACCESS_TOKEN"],
    fields: [
      {
        key: "accessToken",
        label: "Personal access token",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "ringcentral",
    name: "RingCentral",
    category: "Communications",
    description: "Business calls, SMS and telephony events.",
    env: ["RINGCENTRAL_JWT"],
    fields: [
      {
        key: "jwt",
        label: "JWT credential",
        secret: true,
        placeholder: "••••••••",
      },
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automation",
    description: "Webhook handoff for approved third-party automations.",
    env: ["ZAPIER_WEBHOOK_URL"],
    fields: [
      {
        key: "url",
        label: "Catch Hook URL",
        secret: true,
        placeholder: "https://hooks.zapier.com/…",
      },
    ],
  },
  {
    id: "make",
    name: "Make",
    category: "Automation",
    description: "Scenario webhooks for auxiliary automation and routing.",
    env: ["MAKE_WEBHOOK_URL"],
    fields: [
      {
        key: "url",
        label: "Webhook URL",
        secret: true,
        placeholder: "https://hook.us1.make.com/…",
      },
    ],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "Data export",
    description: "Controlled lead, booking and revenue exports.",
    env: ["GOOGLE_SHEETS_CREDENTIALS"],
    fields: [
      {
        key: "credentials",
        label: "Service account JSON",
        secret: true,
        placeholder: "{ … }",
      },
    ],
  },
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const jsonWithCookies = (body, status, cookies) => {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  for (const value of cookies) headers.append("set-cookie", value);
  return new Response(JSON.stringify(body), { status, headers });
};
const isConfigured = (provider, env) =>
  provider.env.every((key) => Boolean(env[key]));
const publicProvider = (provider, env) => ({
  id: provider.id,
  name: provider.name,
  category: provider.category,
  description: provider.description,
  configured: isConfigured(provider, env),
  fields: provider.fields,
});
const cleanCredentials = (input) =>
  Object.fromEntries(
    Object.entries(input ?? {}).map(([key, value]) => [
      key,
      String(value ?? "").trim(),
    ]),
  );
const sha256 = async (value) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
const base64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
async function vaultKey(env) {
  if (!env.INTEGRATION_ENCRYPTION_KEY)
    throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(env.INTEGRATION_ENCRYPTION_KEY),
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
async function encryptCredentials(credentials, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await vaultKey(env),
    new TextEncoder().encode(JSON.stringify(cleanCredentials(credentials))),
  );
  return { ciphertext: base64(new Uint8Array(encrypted)), iv: base64(iv) };
}
async function decryptCredentials(secret, env) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(secret.iv) },
    await vaultKey(env),
    fromBase64(secret.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
const base64url = (bytes) =>
  base64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
async function googleServiceToken(credentials) {
  const service =
    typeof credentials.credentials === "string"
      ? JSON.parse(credentials.credentials)
      : credentials.credentials;
  if (!service?.client_email || !service?.private_key)
    throw new Error("Invalid Google service-account JSON");
  const now = Math.floor(Date.now() / 1000),
    encode = (value) =>
      base64url(new TextEncoder().encode(JSON.stringify(value)));
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: service.client_email, scope: "https://www.googleapis.com/auth/calendar", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const der = fromBase64(
    service.private_key.replace(
      /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
      "",
    ),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${base64url(new Uint8Array(signature))}`,
    }),
  });
  if (!response.ok) throw new Error(`GOOGLE_AUTH_${response.status}`);
  return (await response.json()).access_token;
}
async function createCalendarBooking(tenantId, contactId, input, env) {
  const startsAt = new Date(input.starts_at),
    endsAt = new Date(input.ends_at);
  if (
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime()) ||
    endsAt <= startsAt ||
    startsAt < new Date()
  )
    throw new Error("Invalid booking window");
  const credentials = await savedCredentials("google-calendar", tenantId, env),
    token = await googleServiceToken(credentials),
    calendarId = credentials.calendarId;
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary || "Service appointment",
        description: `Booked by Recover voice assistant. Call reference: ${input.call_request_id}`,
        start: { dateTime: startsAt.toISOString() },
        end: { dateTime: endsAt.toISOString() },
      }),
    },
  );
  if (!response.ok) throw new Error(`GOOGLE_CALENDAR_${response.status}`);
  const event = await response.json();
  const rows = await supabaseTable("appointments", env, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      contact_id: contactId,
      provider: "google-calendar",
      provider_appointment_id: event.id,
      status: "confirmed",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      verified_at: new Date().toISOString(),
    }),
  });
  return rows[0];
}
async function createAndSendPaymentLink(tenantId, contactId, input, env) {
  const amount = Number(input.amount_minor);
  if (!Number.isInteger(amount) || amount < 50 || amount > 100000000)
    throw new Error("Approved payment amount is missing or invalid");
  const stripe = await savedCredentials("stripe", tenantId, env),
    contacts = await supabaseTable(
      `contacts?id=eq.${contactId}&tenant_id=eq.${tenantId}&select=phone,email&limit=1`,
      env,
    ),
    contact = contacts[0];
  if (!contact) throw new Error("Contact not found");
  const baseUrl =
    env.NEXT_PUBLIC_APP_URL ||
    "https://recoverhq.com";
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${baseUrl}/?payment=success`,
    cancel_url: `${baseUrl}/?payment=cancelled`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": String(
      input.currency || "usd",
    ).toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][product_data][name]": String(
      input.description || "Service deposit",
    ).slice(0, 120),
    "metadata[tenant_id]": tenantId,
    "metadata[contact_id]": contactId,
    "metadata[call_request_id]": String(input.call_request_id || ""),
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${stripe.apiKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!response.ok) throw new Error(`STRIPE_CHECKOUT_${response.status}`);
  const session = await response.json();
  if (contact.phone) {
    const twilio = await savedCredentials("twilio", tenantId, env);
    const sms = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilio.accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${btoa(`${twilio.accountSid}:${twilio.authToken}`)}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: contact.phone,
          From: twilio.phoneNumber,
          Body: `Here is your secure payment link: ${session.url}`,
        }),
      },
    );
    if (!sms.ok) throw new Error(`PAYMENT_LINK_SMS_${sms.status}`);
  }
  return { checkout_session_id: session.id, url: session.url };
}

async function probe(provider, credentials, env) {
  const c = cleanCredentials(credentials);
  let url;
  let headers = {};
  if (provider.id === "openai") {
    const key = c.apiKey || env.OPENAI_API_KEY;
    if (!key) throw new Error("Enter an OpenAI API key");
    url = "https://api.openai.com/v1/models";
    headers = { authorization: `Bearer ${key}` };
  } else if (provider.id === "twilio") {
    const sid = c.accountSid || env.TWILIO_ACCOUNT_SID,
      token = c.authToken || env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Enter the Account SID and auth token");
    url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}.json`;
    headers = { authorization: `Basic ${btoa(`${sid}:${token}`)}` };
  } else if (provider.id === "resend") {
    const key = c.apiKey || env.RESEND_API_KEY;
    if (!key) throw new Error("Enter a Resend API key");
    url = "https://api.resend.com/domains";
    headers = { authorization: `Bearer ${key}` };
  } else if (provider.id === "stripe") {
    const key = c.apiKey || env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Enter a Stripe secret key");
    url = "https://api.stripe.com/v1/account";
    headers = { authorization: `Bearer ${key}` };
  } else if (provider.id === "supabase") {
    const base = c.url || env.NEXT_PUBLIC_SUPABASE_URL,
      key = c.apiKey || env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key)
      throw new Error("Enter the project URL and service role key");
    const parsed = new URL(base);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".supabase.co")
    )
      throw new Error("Use a valid HTTPS Supabase project URL");
    url = `${base.replace(/\/$/, "")}/rest/v1/`;
    headers = { apikey: key, authorization: `Bearer ${key}` };
  } else if (provider.id === "livekit") {
    const dispatchUrl = c.dispatchUrl || env.VOICE_DISPATCH_URL;
    if (!dispatchUrl) throw new Error("Enter the deployed voice service URL");
    const parsed = new URL(dispatchUrl);
    if (parsed.protocol !== "https:")
      throw new Error("Voice service must use HTTPS");
    url = `${dispatchUrl.replace(/\/$/, "")}/health`;
  } else if (provider.id === "google-calendar") {
    const calendarCredentials = {
      credentials: c.credentials || env.GOOGLE_CALENDAR_CREDENTIALS,
      calendarId: c.calendarId || env.GOOGLE_CALENDAR_ID,
    };
    if (!calendarCredentials.credentials || !calendarCredentials.calendarId)
      throw new Error("Enter service-account JSON and calendar ID");
    const token = await googleServiceToken(calendarCredentials);
    url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarCredentials.calendarId)}`;
    headers = { authorization: `Bearer ${token}` };
  } else {
    const values = provider.fields.map((field) => c[field.key]).filter(Boolean);
    if (
      values.length !== provider.fields.length &&
      !isConfigured(provider, env)
    )
      throw new Error("Complete every credential field");
    return {
      ok: false,
      verified: false,
      message: `${provider.name} credentials are structurally complete. Live verification requires its OAuth or account-specific adapter and remains pending.`,
    };
  }
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw new Error(
      `${provider.name} rejected the credentials (${response.status})`,
    );
  return {
    ok: true,
    verified: true,
    message: `${provider.name} responded successfully. The credentials are valid.`,
  };
}

const allowedRecipient = (recipient, env) =>
  String(env.TEST_RECIPIENTS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(
      String(recipient || "")
        .trim()
        .toLowerCase(),
    );
const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
async function runAction(kind, body, env, tenantId = null) {
  const recipient = String(body.recipient || "").trim(),
    content = String(body.content || "").trim();
  if (!content || content.length > 12000)
    throw new Error("Content is required and must be under 12,000 characters");
  if (
    kind !== "analysis" &&
    kind !== "operator" &&
    !allowedRecipient(recipient, env)
  )
    throw new Error(
      "Recipient is not in the server-side TEST_RECIPIENTS allowlist",
    );
  if (kind === "email") {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL)
      throw new Error(
        "Resend credentials and RESEND_FROM_EMAIL are not configured",
      );
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [recipient],
        subject: "Recover secure test",
        text: content,
      }),
    });
    if (!response.ok)
      throw new Error(`Resend rejected the test email (${response.status})`);
    const result = await response.json();
    return { message: `Test email accepted by Resend. ID: ${result.id}` };
  }
  if (kind === "call") {
    if (
      !env.TWILIO_ACCOUNT_SID ||
      !env.TWILIO_AUTH_TOKEN ||
      !env.TWILIO_PHONE_NUMBER
    )
      throw new Error(
        "Twilio account, token and phone number are not configured",
      );
    const params = new URLSearchParams({
      To: recipient,
      From: env.TWILIO_PHONE_NUMBER,
      Twiml: `<Response><Say>Hi, I&apos;m the automated assistant for your business through Recover. This is a requested test call. ${escapeXml(content)}</Say></Response>`,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Calls.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    if (!response.ok)
      throw new Error(`Twilio rejected the test call (${response.status})`);
    const result = await response.json();
    return { message: `Test call queued by Twilio. SID: ${result.sid}` };
  }
  let openaiKey = env.OPENAI_API_KEY;
  if (!openaiKey && tenantId) {
    try {
      openaiKey = (await savedCredentials("openai", tenantId, env)).apiKey;
    } catch {
      /* handled below */
    }
  }
  if (!openaiKey) throw new Error("OpenAI is not configured");
  const instructions =
    kind === "operator"
      ? `You are the planning layer of a policy-gated revenue operator for a service business. Based only on supplied facts, recommend exactly one next action from: call, sms, email, wait, human_review, do_not_contact. Return a compact plan with ACTION, WHY, URGENCY, REQUIRED_PROVIDER, DRAFT, MISSING_EVIDENCE, and APPROVAL_REQUIRED. Never claim the action was executed. Prefer do_not_contact or human_review when consent, identity, suppression, calling hours, source evidence, or contactability are unclear.

For an approved business call draft: open with one specific, verified pain point in plain language; identify the represented company and say you are its automated assistant; ask one short diagnostic question; be professional, warm and lightly witty only when it fits; never use jokes about emergencies, money, safety or a person's business performance; never pretend to be human; never invent an audit result, savings number, customer loss or relationship; immediately honor stop requests; offer a human transfer; and keep the opening under 45 words. Do not pressure for payment on the first cold interaction.`
      : "Analyze this service-business customer conversation. Return: intent, urgency, sentiment, next best action, risks, and a short suggested response. Do not invent facts.";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${openaiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions,
      input: content,
      max_output_tokens: 600,
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI rejected the analysis (${response.status})`);
  const result = await response.json();
  return {
    output: result.output_text || "Analysis completed without text output",
  };
}

function validatePublicSite(value) {
  const url = new URL(String(value || "").trim());
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    host === "localhost" ||
    host.endsWith(".local") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(":")
  )
    throw new Error("Enter a public HTTPS company website");
  return url;
}

async function auditWebsite(value) {
  const url = validatePublicSite(value);
  const response = await fetch(url.toString(), {
    headers: { "user-agent": "Recover-Audit/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Website returned ${response.status}`);
  const html = (await response.text()).slice(0, 300000);
  const lower = html.toLowerCase();
  const checks = [
    {
      key: "phone_cta",
      label: "Clickable phone action",
      passed: /href=["']tel:/.test(lower),
    },
    {
      key: "lead_form",
      label: "Lead or estimate form",
      passed: /<form[\s>]/.test(lower),
    },
    {
      key: "booking",
      label: "Online booking path",
      passed:
        /book\s*(now|online|appointment)|schedule\s*(now|online|service)/.test(
          lower,
        ),
    },
    {
      key: "service_area",
      label: "Service-area evidence",
      passed: /service\s+area|areas\s+we\s+serve/.test(lower),
    },
    {
      key: "structured_data",
      label: "Structured business data",
      passed: /application\/ld\+json/.test(lower),
    },
    {
      key: "mobile_viewport",
      label: "Mobile viewport",
      passed: /name=["']viewport["']/.test(lower),
    },
  ];
  return {
    requested_url: url.toString(),
    final_url: response.url,
    title: (
      html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1] || ""
    ).trim(),
    checked_at: new Date().toISOString(),
    checks,
    gaps: checks.filter((check) => !check.passed).map((check) => check.label),
  };
}

const supabaseReady = (env) =>
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

const publicIntakeNeeds = new Set([
  "Missed calls",
  "Slow lead response",
  "Unfollowed estimates",
  "Weak website",
  "Poor local visibility",
  "Too few reviews",
  "No revenue attribution",
  "Complete system",
]);
const publicIntakeServices = new Set(["audit", "front-office", "complete"]);
const publicIntakeText = (value, label, min, max) => {
  const text = String(value || "").trim();
  if (text.length < min || text.length > max)
    throw new Error(`Enter a valid ${label}`);
  return text;
};
function parsePublicIntake(body) {
  const noWebsite = body?.noWebsite === true;
  const rawWebsite = String(body?.websiteUrl || "").trim();
  let websiteUrl = null;
  if (!noWebsite) {
    try {
      const parsed = new URL(rawWebsite);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      websiteUrl = parsed.toString();
    } catch {
      throw new Error(
        "Enter a valid website URL or choose “I do not have a website”",
      );
    }
  }
  const needs = [
    ...new Set((Array.isArray(body?.needs) ? body.needs : []).map(String)),
  ].filter((need) => publicIntakeNeeds.has(need));
  if (!needs.length) throw new Error("Choose at least one revenue leak");
  const service = String(body?.service || "");
  if (!publicIntakeServices.has(service))
    throw new Error("Choose a service path");
  const notes = String(body?.notes || "").trim();
  if (notes.length > 2000)
    throw new Error("Keep notes under 2,000 characters");
  return {
    contact_name: publicIntakeText(body?.name, "name", 2, 120),
    business_name: publicIntakeText(
      body?.businessName,
      "business name",
      2,
      160,
    ),
    phone: publicIntakeText(body?.phone, "phone number", 7, 40),
    email: normalizeEmail(body?.email),
    industry: publicIntakeText(body?.industry, "business type", 2, 120),
    service_area: publicIntakeText(body?.city, "service area", 2, 160),
    website_url: websiteUrl,
    no_website: noWebsite,
    needs,
    service_path: service,
    notes: notes || null,
    status: "new",
  };
}
async function savePublicIntake(input, env) {
  if (!supabaseReady(env)) throw new Error("INTAKE_NOT_CONFIGURED");
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(
    `${base}/rest/v1/public_intake_requests?select=id,created_at`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new Error("INTAKE_STORAGE_FAILED");
  const saved = (await response.json())?.[0];
  if (!saved?.id) throw new Error("INTAKE_STORAGE_FAILED");
  return saved;
}
async function saveOrder(order, tenantId, env) {
  if (!supabaseReady(env)) return null;
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/rest/v1/recovery_orders`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({ ...order, tenant_id: tenantId }),
    },
  );
  if (!response.ok)
    throw new Error(`Order storage failed (${response.status})`);
  return (await response.json())[0];
}

async function ensureCompanyContact(
  companyName,
  website,
  email,
  phone,
  tenantId,
  env,
) {
  const tenant = encodeURIComponent(tenantId),
    site = encodeURIComponent(website);
  let companies = await supabaseTable(
    `companies?tenant_id=eq.${tenant}&website=eq.${site}&select=id&limit=1`,
    env,
  );
  if (!companies.length)
    companies = await supabaseTable("companies", env, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        name: companyName,
        website,
        lifecycle: "prospect",
      }),
    });
  let contact = null;
  if (email || phone) {
    const filters = phone
      ? `phone=eq.${encodeURIComponent(phone)}`
      : `email=eq.${encodeURIComponent(email)}`;
    let contacts = await supabaseTable(
      `contacts?tenant_id=eq.${tenant}&${filters}&select=id&limit=1`,
      env,
    );
    if (!contacts.length)
      contacts = await supabaseTable("contacts", env, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          prefer: "return=representation",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          company_id: companies[0].id,
          email: email || null,
          phone: phone || null,
        }),
      });
    contact = contacts[0];
  }
  return { companyId: companies[0].id, contactId: contact?.id || null };
}

async function listOrders(tenantId, env) {
  if (!supabaseReady(env)) return [];
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const query = new URLSearchParams({
    tenant_id: `eq.${tenantId}`,
    select:
      "id,company_name,domain,status,current_step,findings,action_plan,created_at,updated_at",
    order: "created_at.desc",
    limit: "100",
  });
  const response = await fetch(`${base}/rest/v1/recovery_orders?${query}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!response.ok)
    throw new Error(`Order retrieval failed (${response.status})`);
  return response.json();
}

async function saveProviderEvent(event, tenantId, env) {
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !tenantId
  )
    throw new Error("Supabase event storage is not configured");
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(
    `${base}/rest/v1/provider_events?on_conflict=tenant_id,provider,external_event_id`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        ...event,
        tenant_id: tenantId,
        signature_verified: true,
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Provider event storage failed (${response.status})`);
}

async function supabaseRpc(name, body, env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Supabase queue storage is not configured");
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`Queue operation ${name} failed (${response.status})`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function finishProviderEvent(eventId, succeeded, error, attempt, env) {
  return supabaseRpc(
    "finish_provider_event",
    {
      p_event_id: eventId,
      p_succeeded: succeeded,
      p_error: error || null,
      p_retry_seconds: retryDelaySeconds(attempt),
      p_max_attempts: 8,
    },
    env,
  );
}

async function dispatchProviderEvent(event, env) {
  if (!env.ACTIVEPIECES_EVENT_WEBHOOK_URL || !env.ACTIVEPIECES_WEBHOOK_SECRET)
    throw new Error("Activepieces event webhook is not configured");
  const endpoint = new URL(env.ACTIVEPIECES_EVENT_WEBHOOK_URL);
  if (endpoint.protocol !== "https:")
    throw new Error("Activepieces event webhook must use HTTPS");
  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.ACTIVEPIECES_WEBHOOK_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ schema_version: 1, event }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`Activepieces rejected event (${response.status})`);
}

async function processProviderEvents(limit, env, tenantOverride = null) {
  const tenantId = tenantOverride || env.EVENT_QUEUE_TENANT_ID;
  if (!tenantId) throw new Error("Event queue tenant is not configured");
  const events =
    (await supabaseRpc(
      "claim_provider_events",
      { p_tenant_id: tenantId, p_limit: limit, p_lease_seconds: 120 },
      env,
    )) || [];
  const results = [];
  for (const event of events) {
    try {
      const routed = await supabaseRpc(
        "route_provider_event",
        { p_event_id: event.id },
        env,
      );
      if (env.ACTIVEPIECES_EVENT_WEBHOOK_URL && env.ACTIVEPIECES_WEBHOOK_SECRET)
        await dispatchProviderEvent(event, env);
      await finishProviderEvent(event.id, true, null, event.attempt_count, env);
      results.push({ id: event.id, status: "completed", routed });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Dispatch failed";
      await finishProviderEvent(
        event.id,
        false,
        message,
        event.attempt_count,
        env,
      );
      results.push({
        id: event.id,
        status: event.attempt_count >= 8 ? "dead_lettered" : "retry_scheduled",
        error: message,
      });
    }
  }
  return results;
}

async function listQueueFailures(env) {
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.EVENT_QUEUE_TENANT_ID
  )
    throw new Error("Queue storage is not configured");
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const query = new URLSearchParams({
    tenant_id: `eq.${env.EVENT_QUEUE_TENANT_ID}`,
    processed_at: "is.null",
    select:
      "id,provider,event_type,attempt_count,processing_error,received_at,next_attempt_at,dead_lettered_at",
    order: "received_at.asc",
    limit: "50",
  });
  const response = await fetch(`${base}/rest/v1/provider_events?${query}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Queue status failed (${response.status})`);
  return response.json();
}

async function supabaseTable(path, env, options = {}) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Operations storage is not configured");
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...options.headers,
    },
  });
  if (!response.ok)
    throw new Error(`Operations query failed (${response.status})`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function listIntegrationStates(tenantId, env) {
  if (!supabaseReady(env)) return [];
  return supabaseTable(
    `integration_connections?tenant_id=eq.${encodeURIComponent(tenantId)}&select=provider,mode,status,capabilities,last_tested_at,last_success_at,last_webhook_at,last_error_code,updated_at`,
    env,
  );
}

async function storeIntegration(provider, credentials, test, context, env) {
  if (!supabaseReady(env))
    throw new Error("Connect Supabase before saving integrations");
  const encrypted = await encryptCredentials(credentials, env);
  await supabaseTable(
    "integration_secrets?on_conflict=tenant_id,provider",
    env,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        tenant_id: context.tenantId,
        provider: provider.id,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        key_version: 1,
        created_by: context.user.id,
        rotated_at: new Date().toISOString(),
      }),
    },
  );
  const now = new Date().toISOString(),
    status = test.verified ? "connected" : "needs_credentials";
  const rows = await supabaseTable(
    "integration_connections?on_conflict=tenant_id,provider",
    env,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        tenant_id: context.tenantId,
        provider: provider.id,
        mode: "test",
        status,
        secret_reference: `vault:${provider.id}`,
        capabilities: provider.env,
        last_tested_at: now,
        last_success_at: test.verified ? now : null,
        last_error_code: test.verified ? null : "OAUTH_VERIFICATION_REQUIRED",
        updated_at: now,
      }),
    },
  );
  return rows[0];
}

async function savedCredentials(providerId, tenantId, env) {
  const rows = await supabaseTable(
    `integration_secrets?tenant_id=eq.${encodeURIComponent(tenantId)}&provider=eq.${encodeURIComponent(providerId)}&select=ciphertext,iv&limit=1`,
    env,
  );
  if (!rows?.length) throw new Error("No saved credentials for this provider");
  return decryptCredentials(rows[0], env);
}

async function runtimeStatus(tenantId, env) {
  const tenant = encodeURIComponent(tenantId);
  const [connections, jobs, executions, events, settings] = await Promise.all([
    listIntegrationStates(tenantId, env),
    supabaseTable(
      `automation_jobs?tenant_id=eq.${tenant}&select=id,state,workflow_key,current_step,attempt_count,last_error,available_at,updated_at&order=updated_at.desc&limit=100`,
      env,
    ),
    supabaseTable(
      `action_executions?tenant_id=eq.${tenant}&select=id,action_type,provider,status,error_code,created_at,updated_at&order=created_at.desc&limit=50`,
      env,
    ),
    supabaseTable(
      `provider_events?tenant_id=eq.${tenant}&select=id,provider,event_type,processed_at,processing_error,received_at&order=received_at.desc&limit=20`,
      env,
    ),
    supabaseTable(
      `automation_settings?tenant_id=eq.${tenant}&select=*&limit=1`,
      env,
    ),
  ]);
  const counts = jobs.reduce((result, item) => {
    result[item.state] = (result[item.state] || 0) + 1;
    return result;
  }, {});
  return {
    connections,
    jobs,
    executions,
    events,
    settings: settings[0] || {
      tenant_id: tenantId,
      master_enabled: false,
      approval_mode: "first_touch",
      daily_call_limit: 25,
      daily_sms_limit: 100,
      daily_email_limit: 100,
      quiet_hours_start: "20:00",
      quiet_hours_end: "08:00",
      fallback_to_human: true,
    },
    counts,
  };
}

async function updateAutomationSettings(tenantId, input, env) {
  const allowed = {
    master_enabled: Boolean(input.master_enabled),
    approval_mode: ["every_action", "first_touch", "policy_only"].includes(
      input.approval_mode,
    )
      ? input.approval_mode
      : "first_touch",
    daily_call_limit: Math.max(
      0,
      Math.min(10000, Number(input.daily_call_limit) || 0),
    ),
    daily_sms_limit: Math.max(
      0,
      Math.min(10000, Number(input.daily_sms_limit) || 0),
    ),
    daily_email_limit: Math.max(
      0,
      Math.min(10000, Number(input.daily_email_limit) || 0),
    ),
    fallback_to_human: input.fallback_to_human !== false,
    updated_at: new Date().toISOString(),
  };
  const rows = await supabaseTable(
    "automation_settings?on_conflict=tenant_id",
    env,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({ tenant_id: tenantId, ...allowed }),
    },
  );
  return rows[0];
}

async function patchAutomationJob(jobId, tenantId, values, env) {
  return supabaseTable(
    `automation_jobs?id=eq.${jobId}&tenant_id=eq.${tenantId}`,
    env,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
    },
  );
}
async function processAutomationJob(job, env) {
  const tenant = encodeURIComponent(job.tenant_id),
    settings = (
      await supabaseTable(
        `automation_settings?tenant_id=eq.${tenant}&select=*&limit=1`,
        env,
      )
    )[0];
  if (!settings?.master_enabled) {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "waiting",
        available_at: new Date(Date.now() + 300000).toISOString(),
        lease_expires_at: null,
        last_error: "AUTOPILOT_DISABLED",
      },
      env,
    );
    return { job_id: job.id, status: "waiting", reason: "AUTOPILOT_DISABLED" };
  }
  const template = (
    await supabaseTable(
      `workflow_templates?tenant_id=eq.${tenant}&key=eq.${encodeURIComponent(job.workflow_key)}&enabled=eq.true&select=*&limit=1`,
      env,
    )
  )[0];
  if (!template) {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "waiting",
        available_at: new Date(Date.now() + 900000).toISOString(),
        lease_expires_at: null,
        last_error: "WORKFLOW_DISABLED",
      },
      env,
    );
    return { job_id: job.id, status: "waiting", reason: "WORKFLOW_DISABLED" };
  }
  const channel =
      job.workflow_key === "audit_outreach"
        ? "call"
        : job.workflow_key === "estimate_followup"
          ? "email"
          : "sms",
    payload = job.context?.payload || job.context || {};
  let recipient =
    channel === "email"
      ? payload.Email || payload.email || payload.CustomerEmail
      : payload.From || payload.Caller || payload.phone;
  if (!recipient && job.contact_id) {
    const contacts = await supabaseTable(
      `contacts?id=eq.${job.contact_id}&tenant_id=eq.${tenant}&select=email,phone&limit=1`,
      env,
    );
    recipient = channel === "email" ? contacts[0]?.email : contacts[0]?.phone;
  }
  if (!recipient) {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "failed",
        lease_expires_at: null,
        last_error: "RECIPIENT_MISSING",
      },
      env,
    );
    return { job_id: job.id, status: "failed", reason: "RECIPIENT_MISSING" };
  }
  const organization = (
    await supabaseTable(
      `organizations?id=eq.${tenant}&select=timezone&limit=1`,
      env,
    )
  )[0];
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: organization?.timezone || "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const localMinutes =
    Number(timeParts.find((part) => part.type === "hour")?.value || 0) * 60 +
    Number(timeParts.find((part) => part.type === "minute")?.value || 0);
  const toMinutes = (value) => {
    const [hour, minute] = String(value || "00:00")
      .split(":")
      .map(Number);
    return hour * 60 + minute;
  };
  const quietStart = toMinutes(settings.quiet_hours_start),
    quietEnd = toMinutes(settings.quiet_hours_end),
    inQuietHours =
      quietStart > quietEnd
        ? localMinutes >= quietStart || localMinutes < quietEnd
        : localMinutes >= quietStart && localMinutes < quietEnd;
  if (inQuietHours) {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "waiting",
        available_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        lease_expires_at: null,
        last_error: "QUIET_HOURS",
      },
      env,
    );
    return { job_id: job.id, status: "waiting", reason: "QUIET_HOURS" };
  }
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const recentActions = await supabaseTable(
    `action_executions?tenant_id=eq.${tenant}&action_type=eq.${channel}&created_at=gte.${encodeURIComponent(dayStart.toISOString())}&status=in.(queued,accepted,delivered)&select=id&limit=10000`,
    env,
  );
  const dailyLimit = Number(
    channel === "call"
      ? settings.daily_call_limit
      : channel === "sms"
        ? settings.daily_sms_limit
        : settings.daily_email_limit,
  );
  if (recentActions.length >= dailyLimit) {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "waiting",
        available_at: new Date(dayStart.getTime() + 86400000).toISOString(),
        lease_expires_at: null,
        last_error: "DAILY_LIMIT",
      },
      env,
    );
    return { job_id: job.id, status: "waiting", reason: "DAILY_LIMIT" };
  }
  const suppressions = job.contact_id
    ? await supabaseTable(
        `suppressions?tenant_id=eq.${tenant}&contact_id=eq.${job.contact_id}&active=eq.true&or=(channel.eq.${channel},channel.is.null)&select=id&limit=1`,
        env,
      )
    : [];
  if (suppressions.length) {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      { state: "cancelled", lease_expires_at: null, last_error: "SUPPRESSED" },
      env,
    );
    return { job_id: job.id, status: "cancelled", reason: "SUPPRESSED" };
  }
  const consents = job.contact_id
    ? await supabaseTable(
        `consent_records?tenant_id=eq.${tenant}&contact_id=eq.${job.contact_id}&channel=eq.${channel}&status=eq.granted&select=id,effective_at,expires_at&order=effective_at.desc&limit=1`,
        env,
      )
    : [];
  const hasConsent = Boolean(
    consents[0] &&
      (!consents[0].expires_at ||
        new Date(consents[0].expires_at) > new Date()),
  );
  const approvals = await supabaseTable(
    `approvals?tenant_id=eq.${tenant}&action=eq.${channel}&payload->>automation_job_id=eq.${job.id}&select=id,status&order=created_at.desc&limit=1`,
    env,
  );
  if (approvals[0]?.status === "rejected") {
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "cancelled",
        lease_expires_at: null,
        last_error: "APPROVAL_REJECTED",
      },
      env,
    );
    return { job_id: job.id, status: "cancelled", reason: "APPROVAL_REJECTED" };
  }
  const requiresApproval =
    settings.approval_mode === "every_action" ||
    !hasConsent ||
    settings.approval_mode === "first_touch";
  if (requiresApproval && approvals[0]?.status !== "approved") {
    if (!approvals.length)
      await supabaseTable("approvals", env, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          prefer: "return=minimal",
        },
        body: JSON.stringify({
          tenant_id: job.tenant_id,
          action: channel,
          payload: {
            automation_job_id: job.id,
            workflow_key: job.workflow_key,
            recipient_hint:
              channel === "email"
                ? String(recipient).replace(/(^.).*(@.*$)/, "$1***$2")
                : String(recipient).slice(-4),
          },
          status: "pending",
          requested_by: "automation_runtime",
        }),
      });
    await patchAutomationJob(
      job.id,
      job.tenant_id,
      {
        state: "approval",
        lease_expires_at: null,
        last_error: hasConsent
          ? "APPROVAL_REQUIRED"
          : "CONSENT_OR_APPROVAL_REQUIRED",
      },
      env,
    );
    return { job_id: job.id, status: "approval" };
  }
  const provider =
      channel === "email"
        ? "resend"
        : channel === "call"
          ? "livekit"
          : "twilio",
    credentials = await savedCredentials(provider, job.tenant_id, env);
  const body =
    job.workflow_key === "missed_call"
      ? "Sorry we missed your call. How can our service team help? Reply STOP to opt out."
      : job.workflow_key === "estimate_followup"
        ? "Checking in on your estimate. Reply if you have questions or would like to schedule service."
        : job.workflow_key === "audit_outreach"
          ? "Approved AI audit outreach call"
          : "Thanks for choosing our team. If everything went well, would you mind sharing a review? Reply STOP to opt out.";
  let reference;
  if (channel === "call") {
    const endpoint = new URL(credentials.dispatchUrl);
    if (endpoint.protocol !== "https:")
      throw new Error("VOICE_DISPATCH_URL_INVALID");
    const response = await fetch(
      `${endpoint.toString().replace(/\/$/, "")}/dispatch`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${credentials.dispatchSecret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: job.tenant_id,
          contact_id: job.contact_id,
          call_request_id: job.id,
          phone_number: recipient,
          represented_company:
            job.context.company_name || "the service company",
          assistant_name: job.context.assistant_name || "Alex",
          purpose:
            "Discuss the verified website audit and determine whether a recovery review is useful",
          verified_pain_point:
            job.context.verified_pain_point ||
            "a verified website conversion gap",
          disclosure: "the automated assistant",
        }),
      },
    );
    if (!response.ok) throw new Error(`VOICE_DISPATCH_${response.status}`);
    reference = (await response.json()).dispatch_id;
  } else if (channel === "sms") {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(credentials.accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${btoa(`${credentials.accountSid}:${credentials.authToken}`)}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: recipient,
          From: credentials.phoneNumber,
          Body: body,
        }),
      },
    );
    if (!response.ok) throw new Error(`TWILIO_${response.status}`);
    reference = (await response.json()).sid;
  } else {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${credentials.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: credentials.fromEmail,
        to: [recipient],
        subject: "Quick follow-up from your service team",
        text: body,
      }),
    });
    if (!response.ok) throw new Error(`RESEND_${response.status}`);
    reference = (await response.json()).id;
  }
  await supabaseTable("action_executions", env, {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({
      tenant_id: job.tenant_id,
      automation_job_id: job.id,
      action_type: channel,
      provider,
      recipient_hash: await sha256(recipient),
      idempotency_key: `${job.id}:${job.current_step}`,
      policy_decision: {
        consent: hasConsent,
        approval: approvals[0]?.status || null,
      },
      request_summary: { workflow_key: job.workflow_key },
      status: "accepted",
      provider_reference: reference,
    }),
  });
  await patchAutomationJob(
    job.id,
    job.tenant_id,
    {
      state: "completed",
      current_step: job.current_step + 1,
      lease_expires_at: null,
      last_error: null,
    },
    env,
  );
  return { job_id: job.id, status: "completed", provider_reference: reference };
}

async function processAutomationJobs(limit, env, tenantId = null) {
  const jobs =
      (await supabaseRpc(
        "claim_automation_jobs",
        {
          p_limit: Math.min(25, Math.max(1, limit || 10)),
          p_lease_seconds: 120,
          p_tenant_id: tenantId,
        },
        env,
      )) || [],
    results = [];
  for (const job of jobs) {
    try {
      results.push(await processAutomationJob(job, env));
    } catch (error) {
      const message =
          error instanceof Error ? error.message : "AUTOMATION_FAILED",
        dead = job.attempt_count >= 8;
      await patchAutomationJob(
        job.id,
        job.tenant_id,
        {
          state: dead ? "dead_letter" : "waiting",
          available_at: new Date(
            Date.now() + retryDelaySeconds(job.attempt_count) * 1000,
          ).toISOString(),
          lease_expires_at: null,
          last_error: message,
        },
        env,
      );
      results.push({
        job_id: job.id,
        status: dead ? "dead_letter" : "retry",
        reason: message,
      });
    }
  }
  return results;
}

async function getOperations(tenantId, env) {
  const tenant = encodeURIComponent(tenantId);
  const [approvals, failures, appointments, payments] = await Promise.all([
    supabaseTable(
      `approvals?tenant_id=eq.${tenant}&status=eq.pending&select=id,action,payload,requested_by,expires_at,created_at,recovery_order_id&order=created_at.asc&limit=25`,
      env,
    ),
    supabaseTable(
      `provider_events?tenant_id=eq.${tenant}&processed_at=is.null&select=id,provider,event_type,attempt_count,processing_error,received_at,next_attempt_at,dead_lettered_at&order=received_at.asc&limit=25`,
      env,
    ),
    supabaseTable(
      `appointments?tenant_id=eq.${tenant}&status=in.(held,confirmed)&select=id,provider,status,starts_at,ends_at,recovery_order_id&starts_at=gte.${encodeURIComponent(new Date().toISOString())}&order=starts_at.asc&limit=25`,
      env,
    ),
    supabaseTable(
      `payments?tenant_id=eq.${tenant}&status=eq.succeeded&select=id,provider,status,amount_minor,currency,verified_at,recovery_order_id&order=verified_at.desc&limit=25`,
      env,
    ),
  ]);
  return { approvals, failures, appointments, payments };
}

async function decideApproval(id, decision, reason, tenantId, env) {
  const tenant = encodeURIComponent(tenantId);
  const query = `approvals?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${tenant}&status=eq.pending`;
  const rows = await supabaseTable(query, env, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify({
      status: decision,
      decision_reason: reason || null,
      decided_at: new Date().toISOString(),
    }),
  });
  if (!rows?.length)
    throw new Error("Approval was already decided or does not exist");
  const jobId = rows[0].payload?.automation_job_id;
  if (jobId) {
    await patchAutomationJob(
      jobId,
      tenantId,
      {
        state: decision === "approved" ? "queued" : "cancelled",
        available_at: new Date().toISOString(),
        lease_expires_at: null,
        last_error: decision === "approved" ? null : "APPROVAL_REJECTED",
      },
      env,
    );
  }
  return rows[0];
}

async function completeAudit(id, result, env) {
  const jobs = await supabaseTable(
    `audit_jobs?id=eq.${encodeURIComponent(id)}&status=eq.running`,
    env,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "succeeded",
        final_url: result.final_url,
        lighthouse: result.lighthouse,
        summary: { evidence_count: result.evidence.length },
        completed_at: new Date().toISOString(),
      }),
    },
  );
  if (!jobs?.length) throw new Error("Audit job is not running");
  if (result.evidence.length)
    await supabaseTable("audit_evidence", env, {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify(
        result.evidence.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          tenant_id: jobs[0].tenant_id,
          audit_job_id: id,
        })),
      ),
    });
  if (jobs[0].recovery_order_id) {
    const orders = await supabaseTable(
        `recovery_orders?id=eq.${jobs[0].recovery_order_id}&tenant_id=eq.${jobs[0].tenant_id}&select=id,company_name,contact_id,contact_phone&limit=1`,
        env,
      ),
      order = orders[0];
    if (order?.contact_phone)
      await supabaseTable("automation_jobs", env, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({
          tenant_id: jobs[0].tenant_id,
          workflow_key: "audit_outreach",
          recovery_order_id: order.id,
          contact_id: order.contact_id,
          state: "queued",
          idempotency_key: `audit-outreach:${order.id}`,
          context: {
            company_name: order.company_name,
            phone: order.contact_phone,
            verified_pain_point:
              result.evidence[0]?.label || "a verified website conversion gap",
            audit: {
              final_url: result.final_url,
              lighthouse: result.lighthouse,
            },
          },
        }),
      });
  }
  return jobs[0];
}
async function wakeAuditRunner(env) {
  try {
    if (!env.AUDIT_RUNNER_URL || !env.AUDIT_RUNNER_SECRET) return false;
    const endpoint = new URL(env.AUDIT_RUNNER_URL);
    if (endpoint.protocol !== "https:") return false;
    const response = await fetch(
      `${endpoint.toString().replace(/\/$/, "")}/run`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${env.AUDIT_RUNNER_SECRET}` },
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

function evaluate(input) {
  const reasons = [];
  if (!input.globalEnabled) reasons.push("GLOBAL_DISABLED");
  if (!input.tenantEnabled) reasons.push("TENANT_DISABLED");
  if (!input.channelEnabled) reasons.push("CHANNEL_DISABLED");
  if (input.testMode && !input.recipientAllowlisted)
    reasons.push("TEST_RECIPIENT_REQUIRED");
  if (input.suppressed) reasons.push("SUPPRESSED");
  if (!input.consentValid) reasons.push("CONSENT_REQUIRED");
  if (input.insideQuietHours) reasons.push("QUIET_HOURS");
  if (!input.underDailyLimit) reasons.push("DAILY_LIMIT");
  if (!String(input.idempotencyKey || "").trim())
    reasons.push("IDEMPOTENCY_KEY_REQUIRED");
  return {
    allowed: reasons.length === 0,
    code: reasons[0] || "ALLOWED",
    reasons,
  };
}

const authEnabled = (env) =>
  Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
const roleRank = { viewer: 0, operator: 1, admin: 2, owner: 3 };
const hasRole = (context, minimum) =>
  roleRank[context.role] >= roleRank[minimum];
const authFailure = (error) => {
  const code = error instanceof Error ? error.message : "AUTH_REQUIRED";
  if (code === "AUTH_REQUIRED")
    return json({ error: { code, message: "Sign in to continue" } }, 401);
  if (code === "FORBIDDEN")
    return json(
      {
        error: {
          code,
          message: "Your organization role cannot perform this action",
        },
      },
      403,
    );
  return json(
    {
      error: {
        code: "AUTH_UNAVAILABLE",
        message: "Organization authentication is not fully configured",
      },
    },
    503,
  );
};
const publicSession = (context) => ({
  user: context.user,
  role: context.role,
  organization: context.organization,
});
const validMutationOrigin = (request) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
};

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/owner/login" && request.method === "POST") {
      if (!validMutationOrigin(request))
        return json({ error: "Request origin was rejected." }, 403);
      if (!ownerAuthConfigured(env))
        return json(
          {
            error:
              "Owner access is not configured. Add OWNER_DASHBOARD_PASSWORD and OWNER_SESSION_SECRET to the deployed environment, then redeploy.",
            code: "OWNER_AUTH_NOT_CONFIGURED",
          },
          503,
        );
      if (Number(request.headers.get("content-length") || 0) > 4096)
        return json({ error: "Request is too large." }, 413);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Enter your owner password." }, 422);
      }
      const candidate = String(body?.password ?? "");
      if (!candidate || candidate.length > 256)
        return json({ error: "Enter your owner password." }, 422);
      if (!(await validOwnerPassword(candidate, env)))
        return json({ error: "Incorrect owner password." }, 401);
      return jsonWithCookies(
        { ok: true },
        200,
        [await ownerSessionCookie(env)],
      );
    }
    if (url.pathname === "/api/owner/logout" && request.method === "POST")
      return jsonWithCookies(
        { ok: true },
        200,
        [clearOwnerSessionCookie()],
      );
    if (url.pathname === "/api/intake" && request.method === "POST") {
      if (!validMutationOrigin(request))
        return json(
          {
            error: {
              code: "ORIGIN_REJECTED",
              message: "Request origin was rejected",
            },
          },
          403,
        );
      if (Number(request.headers.get("content-length") || 0) > 32768)
        return json(
          {
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Request is too large",
            },
          },
          413,
        );
      try {
        const input = parsePublicIntake(await request.json());
        const saved = await savePublicIntake(input, env);
        return json(
          { data: { received: true, requestId: saved.id } },
          201,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "INTAKE_NOT_CONFIGURED")
          return json(
            {
              error: {
                code: message,
                message:
                  "Online requests are being connected. Please email hello@recoverhq.com for immediate help.",
              },
            },
            503,
          );
        if (message === "INTAKE_STORAGE_FAILED")
          return json(
            {
              error: {
                code: "INTAKE_UNAVAILABLE",
                message:
                  "We could not save your request. Please try again or email hello@recoverhq.com.",
              },
            },
            503,
          );
        return json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: message || "Check the form and try again",
            },
          },
          422,
        );
      }
    }
    if (
      (url.pathname === "/owner" || url.pathname.startsWith("/owner/")) &&
      url.pathname !== "/owner/login" &&
      url.pathname !== "/owner/login/"
    ) {
      if (!(await validOwnerSession(request, env))) {
        const login = new URL("/owner/login", request.url);
        login.searchParams.set("next", url.pathname);
        if (!ownerAuthConfigured(env)) login.searchParams.set("setup", "required");
        return Response.redirect(login, 302);
      }
    }
    if (url.pathname === "/api/health" && request.method === "GET")
      return json({
        data: {
          status: "healthy",
          mode: env.COMMUNICATION_MODE || "test",
          timestamp: new Date().toISOString(),
        },
      });
    if (url.pathname === "/api/auth/config" && request.method === "GET")
      return json({ data: { enabled: authEnabled(env) } });
    if (url.pathname === "/api/auth/signup" && request.method === "POST") {
      if (!validMutationOrigin(request))
        return json({ error: { code: "ORIGIN_REJECTED", message: "Request origin was rejected" } }, 403);
      if (!authEnabled(env))
        return json({ error: { code: "AUTH_NOT_CONFIGURED", message: "Account creation is not configured yet" } }, 503);
      if (Number(request.headers.get("content-length") || 0) > 16384)
        return json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request is too large" } }, 413);
      let body;
      try { body = await request.json(); }
      catch { return json({ error: { code: "VALIDATION_ERROR", message: "Check the form and try again" } }, 422); }
      const businessName=String(body.businessName||"").trim();
      const password=String(body.password||"");
      const timezone=String(body.timezone||"America/Chicago").trim();
      let email;
      try { email=normalizeEmail(body.email); }
      catch(error){ return json({error:{code:"VALIDATION_ERROR",message:error instanceof Error?error.message:"Enter a valid email address"}},422); }
      if(businessName.length<2||businessName.length>160)
        return json({error:{code:"VALIDATION_ERROR",message:"Enter your business name"}},422);
      if(password.length<10||password.length>256)
        return json({error:{code:"VALIDATION_ERROR",message:"Use at least 10 characters for your password"}},422);
      if(timezone.length>100)
        return json({error:{code:"VALIDATION_ERROR",message:"Choose a valid timezone"}},422);
      try{
        const result=await signupAccount({businessName,email,password,timezone},env);
        const payload={data:{accountCreated:true,emailConfirmationRequired:!result.session.access_token,organization:result.organization}};
        return result.session.access_token&&result.session.refresh_token
          ? jsonWithCookies(payload,201,sessionCookies(result.session))
          : json(payload,201);
      }catch(error){
        return json({error:{code:"SIGNUP_FAILED",message:error instanceof Error?error.message:"Could not create your account"}},400);
      }
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      if (!authEnabled(env))
        return json(
          {
            error: {
              code: "AUTH_NOT_CONFIGURED",
              message: "Authentication is not configured",
            },
          },
          503,
        );
      if (Number(request.headers.get("content-length") || 0) > 16384)
        return json(
          {
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Request is too large",
            },
          },
          413,
        );
      let body;
      try {
        body = await request.json();
      } catch {
        return json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
          422,
        );
      }
      let email;
      try { email=normalizeEmail(body.email); }
      catch(error){ return json({error:{code:"VALIDATION_ERROR",message:error instanceof Error?error.message:"Enter a valid email address"}},422); }
      const password = String(body.password || "");
      if (password.length < 8 || password.length > 256)
        return json({error:{code:"VALIDATION_ERROR",message:"Enter your password"}},422);
      try {
        const session = await passwordLogin(email, password, env);
        const headers = new Headers(request.headers);
        headers.set(
          "cookie",
          `recover_access=${encodeURIComponent(session.access_token)}`,
        );
        const context = await resolveContext(
          new Request(request.url, { headers }),
          env,
        );
        return jsonWithCookies(
          { data: publicSession(context) },
          200,
          sessionCookies(session),
        );
      } catch (error) {
        return json(
          {
            error: {
              code: "LOGIN_FAILED",
              message:
                error instanceof Error && error.message === "FORBIDDEN"
                  ? "This user has no Recover organization membership"
                  : error instanceof Error
                    ? error.message
                    : "Login failed",
            },
          },
          401,
        );
      }
    }
    if (url.pathname === "/api/auth/refresh" && request.method === "POST") {
      try {
        const session = await refreshSession(
          cookieValue(request.headers.get("cookie"), "recover_refresh"),
          env,
        );
        return jsonWithCookies(
          { data: { refreshed: true } },
          200,
          sessionCookies(session),
        );
      } catch {
        return jsonWithCookies(
          { error: { code: "AUTH_REQUIRED", message: "Session expired" } },
          401,
          clearSessionCookies(),
        );
      }
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST")
      return jsonWithCookies(
        { data: { signedOut: true } },
        200,
        clearSessionCookies(),
      );
    if (url.pathname === "/api/auth/session" && ["GET", "POST"].includes(request.method)) {
      if (!authEnabled(env))
        return json(
          {
            error: {
              code: "AUTH_NOT_CONFIGURED",
              message: "Authentication is not configured",
            },
          },
          503,
        );
      try {
        return json({
          data: publicSession(await resolveContext(request, env)),
        });
      } catch (error) {
        return authFailure(error);
      }
    }
    const publicReportMatch = url.pathname.match(
      /^\/api\/public\/audits\/([A-Za-z0-9_-]{32,128})$/,
    );
    if (publicReportMatch && request.method === "GET") {
      if (!supabaseReady(env))
        return json(
          { error: { code: "NOT_FOUND", message: "Report not found" } },
          404,
        );
      try {
        const hash = await sha256(publicReportMatch[1]);
        const reports = await supabaseTable(
          `public_audit_reports?token_hash=eq.${hash}&status=eq.published&select=id,title,published_at,expires_at,audit_job_id,audit_jobs(final_url,completed_at,lighthouse,summary)&limit=1`,
          env,
        );
        const report = reports?.[0];
        if (
          !report ||
          (report.expires_at && new Date(report.expires_at) < new Date())
        )
          return json(
            { error: { code: "NOT_FOUND", message: "Report not found" } },
            404,
          );
        const evidence = await supabaseTable(
          `audit_evidence?audit_job_id=eq.${report.audit_job_id}&select=kind,label,source_url,selector,value,captured_at&order=captured_at.asc`,
          env,
        );
        return json({ data: { ...report, evidence } });
      } catch {
        return json(
          { error: { code: "NOT_FOUND", message: "Report not found" } },
          404,
        );
      }
    }
    if (
      url.pathname === "/api/internal/events/process" &&
      request.method === "POST"
    ) {
      if (
        !authorizeWorker(
          request.headers.get("authorization"),
          env.WORKER_SHARED_SECRET,
        )
      )
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Worker authorization required",
            },
          },
          401,
        );
      let body = {};
      try {
        body = await request.json();
      } catch {
        /* Empty body uses the safe default. */
      }
      const limit = Math.min(25, Math.max(1, Number(body.limit) || 10));
      try {
        const data = await processProviderEvents(limit, env);
        return json({ data, claimed: data.length });
      } catch (error) {
        return json(
          {
            error: {
              code: "QUEUE_PROCESSING_FAILED",
              message:
                error instanceof Error
                  ? error.message
                  : "Queue processing failed",
            },
          },
          503,
        );
      }
    }
    if (
      url.pathname === "/api/internal/queue/status" &&
      request.method === "GET"
    ) {
      if (
        !authorizeWorker(
          request.headers.get("authorization"),
          env.WORKER_SHARED_SECRET,
        )
      )
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Worker authorization required",
            },
          },
          401,
        );
      try {
        const events = await listQueueFailures(env);
        return json({
          data: {
            pending: events.filter((event) => !event.dead_lettered_at),
            dead_lettered: events.filter((event) => event.dead_lettered_at),
          },
        });
      } catch (error) {
        return json(
          {
            error: {
              code: "QUEUE_STATUS_FAILED",
              message:
                error instanceof Error ? error.message : "Queue status failed",
            },
          },
          503,
        );
      }
    }
    if (
      url.pathname === "/api/internal/automation/process" &&
      request.method === "POST"
    ) {
      if (
        !authorizeWorker(
          request.headers.get("authorization"),
          env.WORKER_SHARED_SECRET,
        )
      )
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Worker authorization required",
            },
          },
          401,
        );
      let body = {};
      try {
        body = await request.json();
      } catch {
        /* default */
      }
      try {
        const data = await processAutomationJobs(Number(body.limit) || 10, env);
        return json({ data, claimed: data.length });
      } catch (error) {
        return json(
          {
            error: {
              code: "AUTOMATION_PROCESSING_FAILED",
              message:
                error instanceof Error
                  ? error.message
                  : "Automation processing failed",
            },
          },
          503,
        );
      }
    }
    if (
      url.pathname === "/api/internal/voice/tool" &&
      request.method === "POST"
    ) {
      if (
        !authorizeWorker(
          request.headers.get("authorization"),
          env.VOICE_AGENT_SHARED_SECRET,
        )
      )
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Voice-agent authorization required",
            },
          },
          401,
        );
      let body;
      try {
        body = await request.json();
      } catch {
        return json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
          422,
        );
      }
      const tenantId = String(body.tenant_id || ""),
        contactId = String(body.contact_id || ""),
        action = String(body.action || "");
      if (
        !/^[0-9a-f-]{36}$/i.test(tenantId) ||
        !/^[0-9a-f-]{36}$/i.test(contactId)
      )
        return json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Tenant and contact are required",
            },
          },
          422,
        );
      try {
        if (action === "suppress")
          await supabaseTable("suppressions", env, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              prefer: "return=minimal",
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              contact_id: contactId,
              channel: "call",
              reason: String(body.reason || "voice_opt_out").slice(0, 300),
              source: "voice_agent",
              active: true,
            }),
          });
        else if (action === "booking")
          body.booking = await createCalendarBooking(
            tenantId,
            contactId,
            body,
            env,
          );
        else if (action === "payment_link")
          body.payment_link = await createAndSendPaymentLink(
            tenantId,
            contactId,
            body,
            env,
          );
        else if (["human_transfer", "callback"].includes(action))
          await supabaseTable("approvals", env, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              prefer: "return=minimal",
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              action,
              payload: {
                contact_id: contactId,
                call_request_id: body.call_request_id,
                reason: body.reason || null,
                requested_window: body.requested_window || null,
              },
              status: "pending",
              requested_by: "voice_agent",
            }),
          });
        else if (action !== "outcome")
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Unknown voice tool",
              },
            },
            422,
          );
        await supabaseTable("audit_log", env, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            prefer: "return=minimal",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            actor_type: "workflow",
            actor_id: "voice_agent",
            action: `voice.${action}`,
            subject_type: "contact",
            subject_id: contactId,
            metadata: {
              call_request_id: body.call_request_id,
              reason: body.reason || null,
              requested_window: body.requested_window || null,
              starts_at: body.starts_at || null,
              ends_at: body.ends_at || null,
              checkout_session_id:
                body.payment_link?.checkout_session_id || null,
              outcome: body.outcome || null,
            },
          }),
        });
        return json({
          data: {
            ok: true,
            action,
            booking: body.booking || null,
            payment_link: body.payment_link || null,
            end_call: action === "suppress",
          },
        });
      } catch (error) {
        return json(
          {
            error: {
              code: "VOICE_TOOL_FAILED",
              message:
                error instanceof Error ? error.message : "Voice tool failed",
            },
          },
          503,
        );
      }
    }
    if (
      url.pathname === "/api/internal/audits/claim" &&
      request.method === "POST"
    ) {
      if (
        !authorizeWorker(
          request.headers.get("authorization"),
          env.AUDIT_RUNNER_SECRET,
        )
      )
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Audit runner authorization required",
            },
          },
          401,
        );
      try {
        const rows = await supabaseRpc("claim_audit_job", {}, env);
        return rows?.length
          ? json({ data: rows[0] })
          : new Response(null, { status: 204 });
      } catch (error) {
        return json(
          {
            error: {
              code: "AUDIT_CLAIM_FAILED",
              message: error instanceof Error ? error.message : "Claim failed",
            },
          },
          503,
        );
      }
    }
    const auditResultMatch = url.pathname.match(
      /^\/api\/internal\/audits\/([0-9a-f-]{36})\/(complete|fail)$/i,
    );
    if (auditResultMatch && request.method === "POST") {
      if (
        !authorizeWorker(
          request.headers.get("authorization"),
          env.AUDIT_RUNNER_SECRET,
        )
      )
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Audit runner authorization required",
            },
          },
          401,
        );
      let body;
      try {
        body = await request.json();
      } catch {
        return json(
          { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
          422,
        );
      }
      try {
        if (auditResultMatch[2] === "fail") {
          await supabaseTable(
            `audit_jobs?id=eq.${auditResultMatch[1]}&status=eq.running`,
            env,
            {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                status: "failed",
                error: String(body.error || "Audit failed").slice(0, 1000),
                completed_at: new Date().toISOString(),
              }),
            },
          );
          return json({ data: { failed: true } });
        }
        return json({
          data: await completeAudit(auditResultMatch[1], body, env),
        });
      } catch (error) {
        return json(
          {
            error: {
              code: "AUDIT_RESULT_FAILED",
              message: error instanceof Error ? error.message : "Result failed",
            },
          },
          409,
        );
      }
    }
    if (url.pathname === "/api/catalog" && request.method === "GET") {
      return json({
        data: providers.map((provider) => ({
          ...publicProvider(provider, env),
          configured: false,
          connection: null,
        })),
        mode: "setup",
      });
    }
    // Every remaining API route is an authenticated organization route. The tenant
    // comes exclusively from server-verified membership, never request payloads.
    if (
      url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/api/webhooks/")
    ) {
      if (!validMutationOrigin(request))
        return json(
          {
            error: {
              code: "INVALID_ORIGIN",
              message: "Cross-origin mutation rejected",
            },
          },
          403,
        );
      let context;
      try {
        context = await resolveContext(request, env);
      } catch (error) {
        return authFailure(error);
      }
      if (url.pathname === "/api/integrations" && request.method === "GET") {
        const states = await listIntegrationStates(context.tenantId, env),
          byProvider = new Map(states.map((item) => [item.provider, item]));
        return json({
          data: providers.map((provider) => ({
            ...publicProvider(provider, env),
            configured:
              isConfigured(provider, env) ||
              byProvider.get(provider.id)?.status === "connected",
            connection: byProvider.get(provider.id) || null,
          })),
        });
      }
      if (url.pathname === "/api/timeline" && request.method === "GET") {
        const tenant = encodeURIComponent(context.tenantId);
        try {
          const data = await supabaseTable(
            `messages?tenant_id=eq.${tenant}&select=id,conversation_id,direction,channel,body,provider,status,occurred_at,created_at,conversations(id,status,last_message_at,contacts(id,first_name,last_name,email,phone),companies(id,name))&order=occurred_at.desc&limit=100`,
            env,
          );
          return json({ data });
        } catch (error) {
          return json(
            {
              error: {
                code: "TIMELINE_READ_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Timeline unavailable",
              },
            },
            502,
          );
        }
      }
      if (url.pathname === "/api/ledger" && request.method === "GET") {
        const tenant = encodeURIComponent(context.tenantId);
        try {
          const entries = await supabaseTable(
            `revenue_ledger?tenant_id=eq.${tenant}&select=id,entry_type,category,amount_minor,currency,provider,occurred_at,evidence,recovery_order_id&order=occurred_at.desc&limit=200`,
            env,
          );
          const totals = entries.reduce(
            (sum, item) => {
              const sign = item.entry_type === "revenue" ? 1 : -1;
              sum.net_minor += sign * item.amount_minor;
              sum[item.entry_type + "_minor"] =
                (sum[item.entry_type + "_minor"] || 0) + item.amount_minor;
              return sum;
            },
            { net_minor: 0, revenue_minor: 0, refund_minor: 0, cost_minor: 0 },
          );
          return json({ data: { entries, totals } });
        } catch (error) {
          return json(
            {
              error: {
                code: "LEDGER_READ_FAILED",
                message:
                  error instanceof Error ? error.message : "Ledger unavailable",
              },
            },
            502,
          );
        }
      }
      if (url.pathname === "/api/workflows" && request.method === "GET") {
        try {
          return json({
            data: await supabaseTable(
              `workflow_templates?tenant_id=eq.${encodeURIComponent(context.tenantId)}&select=id,key,name,trigger_type,version,enabled,definition,updated_at&order=name.asc`,
              env,
            ),
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "WORKFLOW_READ_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Workflows unavailable",
              },
            },
            502,
          );
        }
      }
      if (url.pathname === "/api/onboarding" && request.method === "GET") {
        try {
          return json({
            data: await supabaseTable(
              `onboarding_progress?tenant_id=eq.${encodeURIComponent(context.tenantId)}&select=step_key,status,evidence,completed_at,updated_at`,
              env,
            ),
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "ONBOARDING_READ_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Onboarding unavailable",
              },
            },
            502,
          );
        }
      }
      if (url.pathname === "/api/audits" && request.method === "GET") {
        try {
          return json({
            data: await supabaseTable(
              `audit_jobs?tenant_id=eq.${encodeURIComponent(context.tenantId)}&select=id,requested_url,final_url,status,lighthouse,summary,error,created_at,completed_at&order=created_at.desc&limit=50`,
              env,
            ),
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "AUDIT_READ_FAILED",
                message:
                  error instanceof Error ? error.message : "Audits unavailable",
              },
            },
            502,
          );
        }
      }
      if (url.pathname === "/api/runtime" && request.method === "GET") {
        try {
          return json({ data: await runtimeStatus(context.tenantId, env) });
        } catch (error) {
          return json(
            {
              error: {
                code: "RUNTIME_READ_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Runtime unavailable",
              },
            },
            502,
          );
        }
      }
      if (url.pathname === "/api/operations" && request.method === "GET") {
        if (!supabaseReady(env))
          return json({
            data: {
              approvals: [],
              failures: [],
              appointments: [],
              payments: [],
            },
            persistence: "unavailable",
          });
        try {
          return json({
            data: await getOperations(context.tenantId, env),
            persistence: "supabase",
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "OPERATIONS_READ_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Operations retrieval failed",
              },
            },
            502,
          );
        }
      }
      const approvalMatch = url.pathname.match(
        /^\/api\/approvals\/([0-9a-f-]{36})\/decision$/i,
      );
      if (approvalMatch && request.method === "POST") {
        if (!hasRole(context, "operator"))
          return authFailure(new Error("FORBIDDEN"));
        if (!supabaseReady(env))
          return json(
            {
              error: {
                code: "PERSISTENCE_REQUIRED",
                message: "Connect Supabase before deciding approvals",
              },
            },
            503,
          );
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        const decision = String(body.decision || "");
        if (!["approved", "rejected"].includes(decision))
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Decision must be approved or rejected",
              },
            },
            422,
          );
        const reason = String(body.reason || "").trim();
        if (reason.length > 500)
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Decision reason must be under 500 characters",
              },
            },
            422,
          );
        try {
          return json({
            data: await decideApproval(
              approvalMatch[1],
              decision,
              reason,
              context.tenantId,
              env,
            ),
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "APPROVAL_DECISION_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Approval decision failed",
              },
            },
            409,
          );
        }
      }
      if (url.pathname === "/api/orders" && request.method === "GET") {
        try {
          return json({
            data: await listOrders(context.tenantId, env),
            persistence: supabaseReady(env) ? "supabase" : "unavailable",
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "ORDER_READ_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Order retrieval failed",
              },
            },
            502,
          );
        }
      }
    }
    if (url.pathname === "/api/webhooks/stripe" && request.method === "POST") {
      if (!env.STRIPE_WEBHOOK_SECRET)
        return json(
          {
            error: {
              code: "WEBHOOK_NOT_CONFIGURED",
              message: "Stripe webhook signing is not configured",
            },
          },
          503,
        );
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 1048576)
        return json(
          {
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Webhook is too large",
            },
          },
          413,
        );
      const body = await request.text(),
        signature = request.headers.get("stripe-signature") || "";
      if (
        !(await verifyStripeSignature({
          body,
          header: signature,
          secret: env.STRIPE_WEBHOOK_SECRET,
        }))
      )
        return json(
          {
            error: {
              code: "INVALID_SIGNATURE",
              message: "Invalid Stripe signature",
            },
          },
          401,
        );
      let event;
      try {
        event = JSON.parse(body);
      } catch {
        return json(
          {
            error: {
              code: "INVALID_EVENT",
              message: "Invalid Stripe event JSON",
            },
          },
          400,
        );
      }
      if (
        !String(event.id || "").startsWith("evt_") ||
        !String(event.type || "").trim()
      )
        return json(
          {
            error: {
              code: "INVALID_EVENT",
              message: "Stripe event ID and type are required",
            },
          },
          422,
        );
      try {
        await saveProviderEvent(
          {
            provider: "stripe",
            external_event_id: event.id,
            event_type: event.type,
            payload: event,
            occurred_at: new Date(
              Number(event.created || 0) * 1000 || Date.now(),
            ).toISOString(),
          },
          env.STRIPE_WEBHOOK_TENANT_ID,
          env,
        );
        return json({ received: true });
      } catch (error) {
        return json(
          {
            error: {
              code: "EVENT_STORAGE_FAILED",
              message:
                error instanceof Error ? error.message : "Event storage failed",
            },
          },
          503,
        );
      }
    }
    if (
      url.pathname === "/api/webhooks/twilio/call-status" &&
      request.method === "POST"
    ) {
      if (!env.TWILIO_AUTH_TOKEN)
        return json(
          {
            error: {
              code: "WEBHOOK_NOT_CONFIGURED",
              message: "Twilio webhook signing is not configured",
            },
          },
          503,
        );
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 131072)
        return json(
          {
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Webhook is too large",
            },
          },
          413,
        );
      const params = new URLSearchParams(await request.text()),
        signature = request.headers.get("x-twilio-signature") || "";
      if (
        !(await verifyTwilioSignature({
          url: request.url,
          params,
          signature,
          authToken: env.TWILIO_AUTH_TOKEN,
        }))
      )
        return json(
          {
            error: {
              code: "INVALID_SIGNATURE",
              message: "Invalid Twilio signature",
            },
          },
          401,
        );
      const callSid = params.get("CallSid") || "",
        status = params.get("CallStatus") || "",
        sequence = params.get("SequenceNumber") || status;
      if (!callSid.startsWith("CA") || !status)
        return json(
          {
            error: {
              code: "INVALID_EVENT",
              message: "Twilio CallSid and CallStatus are required",
            },
          },
          422,
        );
      try {
        await saveProviderEvent(
          {
            provider: "twilio",
            external_event_id: `${callSid}:${sequence}`,
            event_type: `call.${status}`,
            payload: Object.fromEntries(params),
            occurred_at: new Date().toISOString(),
          },
          env.TWILIO_WEBHOOK_TENANT_ID,
          env,
        );
        return json({ received: true });
      } catch (error) {
        return json(
          {
            error: {
              code: "EVENT_STORAGE_FAILED",
              message:
                error instanceof Error ? error.message : "Event storage failed",
            },
          },
          503,
        );
      }
    }
    if (
      url.pathname === "/api/webhooks/twilio/messages" &&
      request.method === "POST"
    ) {
      if (!env.TWILIO_AUTH_TOKEN || !env.TWILIO_WEBHOOK_TENANT_ID)
        return json(
          {
            error: {
              code: "WEBHOOK_NOT_CONFIGURED",
              message: "Twilio messaging webhook is not configured",
            },
          },
          503,
        );
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 131072)
        return json(
          {
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Webhook is too large",
            },
          },
          413,
        );
      const params = new URLSearchParams(await request.text()),
        signature = request.headers.get("x-twilio-signature") || "";
      if (
        !(await verifyTwilioSignature({
          url: request.url,
          params,
          signature,
          authToken: env.TWILIO_AUTH_TOKEN,
        }))
      )
        return json(
          {
            error: {
              code: "INVALID_SIGNATURE",
              message: "Invalid Twilio signature",
            },
          },
          401,
        );
      const messageSid = params.get("MessageSid") || "",
        from = params.get("From") || "",
        to = params.get("To") || "",
        body = params.get("Body") || "";
      if (!messageSid.startsWith("SM") || !from || !to)
        return json(
          {
            error: {
              code: "INVALID_EVENT",
              message: "Twilio MessageSid, From and To are required",
            },
          },
          422,
        );
      try {
        await saveProviderEvent(
          {
            provider: "twilio",
            external_event_id: messageSid,
            event_type: "message.inbound",
            payload: { ...Object.fromEntries(params), Body: body },
            occurred_at: new Date().toISOString(),
          },
          env.TWILIO_WEBHOOK_TENANT_ID,
          env,
        );
        return new Response("<Response></Response>", {
          status: 200,
          headers: { "content-type": "text/xml; charset=utf-8" },
        });
      } catch (error) {
        return json(
          {
            error: {
              code: "EVENT_STORAGE_FAILED",
              message:
                error instanceof Error ? error.message : "Event storage failed",
            },
          },
          503,
        );
      }
    }
    if (url.pathname.startsWith("/api/")) {
      let context;
      try {
        context = await resolveContext(request, env);
      } catch (error) {
        return authFailure(error);
      }
      if (!hasRole(context, "operator"))
        return authFailure(new Error("FORBIDDEN"));
      if (
        url.pathname === "/api/runtime/settings" &&
        request.method === "PUT"
      ) {
        if (!hasRole(context, "admin"))
          return authFailure(new Error("FORBIDDEN"));
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        try {
          return json({
            data: await updateAutomationSettings(context.tenantId, body, env),
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "SETTINGS_UPDATE_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Settings update failed",
              },
            },
            503,
          );
        }
      }
      if (url.pathname === "/api/runtime/run" && request.method === "POST") {
        try {
          const events = await processProviderEvents(10, env, context.tenantId),
            jobs = await processAutomationJobs(10, env, context.tenantId);
          return json({ data: { events, jobs } });
        } catch (error) {
          return json(
            {
              error: {
                code: "RUNTIME_RUN_FAILED",
                message:
                  error instanceof Error ? error.message : "Runtime run failed",
              },
            },
            503,
          );
        }
      }
      if (url.pathname === "/api/audits" && request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        let target;
        try {
          target = validatePublicSite(body.url).toString();
        } catch (error) {
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: error instanceof Error ? error.message : "Invalid URL",
              },
            },
            422,
          );
        }
        try {
          const rows = await supabaseTable("audit_jobs", env, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              prefer: "return=representation",
            },
            body: JSON.stringify({
              tenant_id: context.tenantId,
              requested_url: target,
              status: "queued",
            }),
          });
          await wakeAuditRunner(env);
          return json({ data: rows[0] }, 201);
        } catch (error) {
          return json(
            {
              error: {
                code: "AUDIT_QUEUE_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Audit could not be queued",
              },
            },
            503,
          );
        }
      }
      if (url.pathname === "/api/workflows/seed" && request.method === "POST") {
        try {
          await supabaseRpc(
            "seed_recovery_templates",
            { target: context.tenantId },
            env,
          );
          return json({ data: { seeded: true } });
        } catch (error) {
          return json(
            {
              error: {
                code: "WORKFLOW_SEED_FAILED",
                message:
                  error instanceof Error
                    ? error.message
                    : "Templates unavailable",
              },
            },
            503,
          );
        }
      }
      const workflowMatch = url.pathname.match(
        /^\/api\/workflows\/([0-9a-f-]{36})$/i,
      );
      if (workflowMatch && request.method === "PATCH") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        if (typeof body.enabled !== "boolean")
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "enabled must be boolean",
              },
            },
            422,
          );
        try {
          const rows = await supabaseTable(
            `workflow_templates?id=eq.${workflowMatch[1]}&tenant_id=eq.${context.tenantId}`,
            env,
            {
              method: "PATCH",
              headers: {
                "content-type": "application/json",
                prefer: "return=representation",
              },
              body: JSON.stringify({
                enabled: body.enabled,
                updated_at: new Date().toISOString(),
              }),
            },
          );
          return rows?.length
            ? json({ data: rows[0] })
            : json(
                { error: { code: "NOT_FOUND", message: "Workflow not found" } },
                404,
              );
        } catch (error) {
          return json(
            {
              error: {
                code: "WORKFLOW_UPDATE_FAILED",
                message:
                  error instanceof Error ? error.message : "Update failed",
              },
            },
            503,
          );
        }
      }
      const onboardingMatch = url.pathname.match(
        /^\/api\/onboarding\/([a-z0-9_-]{2,80})$/,
      );
      if (onboardingMatch && request.method === "PUT") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        if (!["pending", "blocked", "complete"].includes(body.status))
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid status" } },
            422,
          );
        try {
          const rows = await supabaseTable(
            "onboarding_progress?on_conflict=tenant_id,step_key",
            env,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                prefer: "resolution=merge-duplicates,return=representation",
              },
              body: JSON.stringify({
                tenant_id: context.tenantId,
                step_key: onboardingMatch[1],
                status: body.status,
                evidence: body.evidence || {},
                completed_at:
                  body.status === "complete" ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }),
            },
          );
          return json({ data: rows[0] });
        } catch (error) {
          return json(
            {
              error: {
                code: "ONBOARDING_UPDATE_FAILED",
                message:
                  error instanceof Error ? error.message : "Update failed",
              },
            },
            503,
          );
        }
      }
      const publishMatch = url.pathname.match(
        /^\/api\/audits\/([0-9a-f-]{36})\/publish$/i,
      );
      if (publishMatch && request.method === "POST") {
        const token =
          crypto.randomUUID().replaceAll("-", "") +
          crypto.randomUUID().replaceAll("-", "");
        try {
          const jobs = await supabaseTable(
            `audit_jobs?id=eq.${publishMatch[1]}&tenant_id=eq.${context.tenantId}&status=eq.succeeded&select=id,final_url`,
            env,
          );
          if (!jobs?.length)
            return json(
              {
                error: {
                  code: "NOT_FOUND",
                  message: "Completed audit not found",
                },
              },
              404,
            );
          const rows = await supabaseTable("public_audit_reports", env, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              prefer: "return=representation",
            },
            body: JSON.stringify({
              tenant_id: context.tenantId,
              audit_job_id: publishMatch[1],
              token_hash: await sha256(token),
              status: "published",
              title: `Website revenue audit — ${new URL(jobs[0].final_url).hostname}`,
              published_at: new Date().toISOString(),
            }),
          });
          return json(
            {
              data: {
                id: rows[0].id,
                url: `${url.origin}/report/?token=${token}`,
              },
            },
            201,
          );
        } catch (error) {
          return json(
            {
              error: {
                code: "REPORT_PUBLISH_FAILED",
                message:
                  error instanceof Error ? error.message : "Publish failed",
              },
            },
            503,
          );
        }
      }
      const match = url.pathname.match(
        /^\/api\/integrations\/([a-z0-9-]+)\/test$/,
      );
      if (match && request.method === "POST") {
        const length = Number(request.headers.get("content-length") || 0);
        if (length > 32768)
          return json(
            {
              error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request is too large",
              },
            },
            413,
          );
        const provider = providers.find((item) => item.id === match[1]);
        if (!provider)
          return json(
            { error: { code: "NOT_FOUND", message: "Unknown provider" } },
            404,
          );
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        if (
          Object.values(body.credentials ?? {}).some(
            (value) => String(value).length > 8192,
          )
        )
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Credential value is too large",
              },
            },
            422,
          );
        try {
          const credentials = Object.keys(body.credentials || {}).length
            ? body.credentials
            : await savedCredentials(provider.id, context.tenantId, env);
          return json({ data: await probe(provider, credentials, env) });
        } catch (error) {
          return json(
            {
              error: {
                code: "CONNECTION_FAILED",
                message:
                  error instanceof Error ? error.message : "Connection failed",
              },
            },
            400,
          );
        }
      }
      const connectMatch = url.pathname.match(
        /^\/api\/integrations\/([a-z0-9-]+)\/connect$/,
      );
      if (connectMatch && request.method === "POST") {
        if (!hasRole(context, "admin"))
          return authFailure(new Error("FORBIDDEN"));
        const provider = providers.find((item) => item.id === connectMatch[1]);
        if (!provider)
          return json(
            { error: { code: "NOT_FOUND", message: "Unknown provider" } },
            404,
          );
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        const credentials = cleanCredentials(body.credentials);
        if (provider.fields.some((field) => !credentials[field.key]))
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Complete every credential field",
              },
            },
            422,
          );
        try {
          const test = await probe(provider, credentials, env);
          const connection = await storeIntegration(
            provider,
            credentials,
            test,
            context,
            env,
          );
          return json({ data: { connection, test } }, 201);
        } catch (error) {
          return json(
            {
              error: {
                code: "CONNECTION_FAILED",
                message:
                  error instanceof Error ? error.message : "Connection failed",
              },
            },
            400,
          );
        }
      }
      const actionMatch = url.pathname.match(
        /^\/api\/actions\/(operator|call|email|analysis)\/test$/,
      );
      if (actionMatch && request.method === "POST") {
        const length = Number(request.headers.get("content-length") || 0);
        if (length > 32768)
          return json(
            {
              error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request is too large",
              },
            },
            413,
          );
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        try {
          return json({
            data: await runAction(actionMatch[1], body, env, context.tenantId),
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "ACTION_FAILED",
                message:
                  error instanceof Error ? error.message : "Action failed",
              },
            },
            400,
          );
        }
      }
      if (url.pathname === "/api/growth/run" && request.method === "POST") {
        const length = Number(request.headers.get("content-length") || 0);
        if (length > 32768)
          return json(
            {
              error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request is too large",
              },
            },
            413,
          );
        let body;
        try {
          body = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        const companyName = String(body.companyName || "").trim();
        if (!companyName || companyName.length > 160)
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Company name is required",
              },
            },
            422,
          );
        try {
          validatePublicSite(body.domain);
        } catch (error) {
          return json(
            {
              error: {
                code: "AUDIT_FAILED",
                message:
                  error instanceof Error ? error.message : "Invalid website",
              },
            },
            400,
          );
        }
        if (!supabaseReady(env))
          return json(
            {
              error: {
                code: "PERSISTENCE_REQUIRED",
                message:
                  "Connect Supabase and run the included migrations before creating autopilot orders. Recover will not pretend a session-only order is durable.",
              },
            },
            503,
          );
        try {
          const audit = await auditWebsite(body.domain);
          let actionPlan = null;
          try {
            actionPlan = await runAction(
              "operator",
              {
                content: JSON.stringify({
                  company: companyName,
                  website: audit.final_url,
                  verified_gaps: audit.gaps,
                  contact_email: String(body.contactEmail || "").trim() || null,
                  contact_phone: String(body.contactPhone || "").trim() || null,
                  constraints:
                    "First-touch outreach requires human approval and verified contactability.",
                }),
              },
              env,
              context.tenantId,
            );
          } catch {
            /* The audit remains useful and the order records that planning is blocked. */
          }
          const order = {
            id: crypto.randomUUID(),
            company_name: companyName,
            domain: audit.final_url,
            contact_email: String(body.contactEmail || "").trim() || null,
            contact_phone: String(body.contactPhone || "").trim() || null,
            status: "review",
            current_step:
              "Full Lighthouse audit queued; outreach waits for verified evidence",
            findings: audit.checks,
            action_plan: actionPlan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const identity = await ensureCompanyContact(
            order.company_name,
            order.domain,
            order.contact_email,
            order.contact_phone,
            context.tenantId,
            env,
          );
          order.company_id = identity.companyId;
          order.contact_id = identity.contactId;
          const stored = await saveOrder(order, context.tenantId, env);
          await supabaseRpc(
            "seed_recovery_templates",
            { target: context.tenantId },
            env,
          );
          const auditJobs = await supabaseTable("audit_jobs", env, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              prefer: "return=representation",
            },
            body: JSON.stringify({
              tenant_id: context.tenantId,
              recovery_order_id: stored.id,
              requested_url: audit.final_url,
              status: "queued",
              summary: { preliminary_checks: audit.checks },
            }),
          });
          await wakeAuditRunner(env);
          return json({
            data: stored,
            persisted: true,
            audit,
            full_audit_job: auditJobs[0],
          });
        } catch (error) {
          return json(
            {
              error: {
                code: "AUDIT_FAILED",
                message:
                  error instanceof Error ? error.message : "Audit failed",
              },
            },
            400,
          );
        }
      }
      if (url.pathname === "/api/policy/check" && request.method === "POST") {
        let input;
        try {
          input = await request.json();
        } catch {
          return json(
            { error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
            422,
          );
        }
        const required = [
          "globalEnabled",
          "tenantEnabled",
          "channelEnabled",
          "testMode",
          "recipientAllowlisted",
          "suppressed",
          "consentValid",
          "insideQuietHours",
          "underDailyLimit",
          "idempotencyKey",
        ];
        if (required.some((key) => input[key] === undefined))
          return json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Missing policy fields",
              },
            },
            422,
          );
        return json({ data: evaluate(input) });
      }
      return json(
        { error: { code: "NOT_FOUND", message: "API route not found" } },
        404,
      );
    }
    if (env.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return new Response("Recover assets are not bound", { status: 503 });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        await processProviderEvents(25, env);
        await processAutomationJobs(25, env);
      })(),
    );
  },
};
export default worker;
