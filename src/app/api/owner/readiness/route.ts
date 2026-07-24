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
      ready: checks.filter((item) => item.state === "ready").length,
      attention: checks.filter((item) => item.state === "attention").length,
      checkedAt: new Date().toISOString(),
    },
  });
}
