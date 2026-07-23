import { normalizedEmail, validRequestOrigin } from "./account-auth";

export type PublicIntake = {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  industry: string;
  city: string;
  websiteUrl: string | null;
  noWebsite: boolean;
  needs: string[];
  service: "audit" | "front-office" | "complete";
  notes: string | null;
};

const allowedNeeds = new Set([
  "Missed calls",
  "Slow lead response",
  "Unfollowed estimates",
  "Weak website",
  "Poor local visibility",
  "Too few reviews",
  "No revenue attribution",
  "Complete system",
]);

const allowedServices = new Set<PublicIntake["service"]>([
  "audit",
  "front-office",
  "complete",
]);

function bounded(value: unknown, label: string, min: number, max: number) {
  const text = String(value || "").trim();
  if (text.length < min || text.length > max) {
    throw new Error(`Enter a valid ${label}`);
  }
  return text;
}

export function parsePublicIntake(body: Record<string, unknown>): PublicIntake {
  const noWebsite = body.noWebsite === true;
  const websiteValue = String(body.websiteUrl || "").trim();
  let websiteUrl: string | null = null;

  if (!noWebsite) {
    try {
      const parsed = new URL(websiteValue);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      websiteUrl = parsed.toString();
    } catch {
      throw new Error("Enter a valid website URL or choose “I do not have a website”");
    }
  }

  const rawNeeds = Array.isArray(body.needs) ? body.needs : [];
  const needs = [...new Set(rawNeeds.map(String))].filter((need) =>
    allowedNeeds.has(need),
  );
  if (needs.length === 0) throw new Error("Choose at least one revenue leak");

  const service = String(body.service || "") as PublicIntake["service"];
  if (!allowedServices.has(service)) throw new Error("Choose a service path");

  const notes = String(body.notes || "").trim();
  if (notes.length > 2000) throw new Error("Keep notes under 2,000 characters");

  return {
    name: bounded(body.name, "name", 2, 120),
    businessName: bounded(body.businessName, "business name", 2, 160),
    phone: bounded(body.phone, "phone number", 7, 40),
    email: normalizedEmail(body.email),
    industry: bounded(body.industry, "business type", 2, 120),
    city: bounded(body.city, "service area", 2, 160),
    websiteUrl,
    noWebsite,
    needs,
    service,
    notes: notes || null,
  };
}

export async function savePublicIntake(input: PublicIntake) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !serviceKey) throw new Error("INTAKE_NOT_CONFIGURED");

  const response = await fetch(
    `${base}/rest/v1/public_intake_requests?select=id,created_at`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({
        contact_name: input.name,
        business_name: input.businessName,
        phone: input.phone,
        email: input.email,
        industry: input.industry,
        service_area: input.city,
        website_url: input.websiteUrl,
        no_website: input.noWebsite,
        needs: input.needs,
        service_path: input.service,
        notes: input.notes,
        status: "new",
      }),
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) throw new Error("INTAKE_STORAGE_FAILED");
  const saved = (await response.json())?.[0];
  if (!saved?.id) throw new Error("INTAKE_STORAGE_FAILED");
  return saved as { id: string; created_at: string };
}

export { validRequestOrigin };
