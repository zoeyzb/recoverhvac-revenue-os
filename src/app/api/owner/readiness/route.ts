import { NextResponse } from "next/server";
import { OWNER_COOKIE, validOwnerToken } from "@/lib/owner-auth";

export const dynamic = "force-dynamic";

type Check = {
  id: string;
  name: string;
  state: "ready" | "attention" | "optional";
  detail: string;
  source: string;
};

type Connector = Check & {
  configured: number;
  expected: number;
};

const connectorDefinitions = [
  {
    id: "supabase",
    name: "Supabase",
    required: true,
    env: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    required: true,
    env: ["OPENAI_API_KEY"],
  },
  {
    id: "twilio",
    name: "Twilio",
    required: false,
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
  },
  {
    id: "livekit",
    name: "LiveKit voice",
    required: false,
    env: ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"],
  },
  {
    id: "twenty",
    name: "Twenty CRM",
    required: false,
    env: ["TWENTY_API_URL", "TWENTY_API_KEY"],
  },
  {
    id: "stripe",
    name: "Stripe",
    required: false,
    env: ["STRIPE_SECRET_KEY"],
  },
  {
    id: "activepieces",
    name: "Activepieces",
    required: false,
    env: [
      "ACTIVEPIECES_URL",
      "ACTIVEPIECES_API_KEY",
      "ACTIVEPIECES_EVENT_WEBHOOK_URL",
      "ACTIVEPIECES_WEBHOOK_SECRET",
    ],
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    required: false,
    env: ["FIRECRAWL_API_KEY"],
  },
] as const;

function connectorStatus(
  definition: (typeof connectorDefinitions)[number],
): Connector {
  const configured = definition.env.filter((key) => Boolean(process.env[key])).length;
  const complete = configured === definition.env.length;
  const missing = definition.env.length - configured;

  return {
    id: definition.id,
    name: definition.name,
    configured,
    expected: definition.env.length,
    state: complete ? "ready" : definition.required ? "attention" : "optional",
    detail: complete
      ? "All expected Vercel variables are present."
      : configured
        ? `${missing} expected Vercel variable${missing === 1 ? " is" : "s are"} missing.`
        : definition.required
          ? "Required Vercel configuration is missing."
          : "Not configured. This integration is optional.",
    source: "Vercel environment",
  };
}

function cookieValue(header: string | null, name: string) {
  for (const item of String(header || "").split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

export async function GET(request: Request) {
  const token = cookieValue(request.headers.get("cookie"), OWNER_COOKIE);
  if (!validOwnerToken(token)) {
    return NextResponse.json(
      { error: { code: "AUTH_REQUIRED", message: "Owner access required" } },
      { status: 401 },
    );
  }

  const authConfigured = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].every((key) => Boolean(process.env[key]));
  const ownerConfigured = [
    "OWNER_DASHBOARD_PASSWORD",
    "OWNER_SESSION_SECRET",
  ].every((key) => Boolean(process.env[key]));
  const firecrawlConfigured = Boolean(process.env.FIRECRAWL_API_KEY);
  const connectors = connectorDefinitions.map(connectorStatus);

  const checks: Check[] = [
    {
      id: "backend",
      name: "Operational API",
      state: "ready",
      detail: "The Vercel application includes the authenticated operational API.",
      source: "Deployed application",
    },
    {
      id: "auth",
      name: "Customer accounts",
      state: authConfigured ? "ready" : "attention",
      detail: authConfigured
        ? "Supabase authentication and server access are configured."
        : "One or more Supabase variables are missing in Vercel.",
      source: "Vercel configuration",
    },
    {
      id: "owner",
      name: "Owner access",
      state: ownerConfigured ? "ready" : "attention",
      detail: ownerConfigured
        ? "Private owner authentication is configured."
        : "Owner password or session signing is missing.",
      source: "Vercel configuration",
    },
    {
      id: "firecrawl",
      name: "Firecrawl enrichment",
      state: firecrawlConfigured ? "ready" : "optional",
      detail: firecrawlConfigured
        ? "Firecrawl is available for structured crawl enrichment."
        : "Optional. Lighthouse audits still require the Railway audit worker.",
      source: "Vercel configuration",
    },
  ];

  return NextResponse.json({
    data: {
      checks,
      connectors,
      connectorsReady: connectors.filter((item) => item.state === "ready").length,
      ready: checks.filter((item) => item.state === "ready").length,
      attention: checks.filter((item) => item.state === "attention").length,
      checkedAt: new Date().toISOString(),
    },
  });
}
