const providers = [
  ["supabase", ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]],
  ["activepieces", ["ACTIVEPIECES_URL", "ACTIVEPIECES_API_KEY"]],
  ["firecrawl", ["FIRECRAWL_API_KEY"]],
  ["twenty", ["TWENTY_API_URL", "TWENTY_API_KEY"]],
  ["twilio", ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]],
  ["livekit", ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]],
  ["openai", ["OPENAI_API_KEY"]],
  ["openoutreach", ["OPENOUTREACH_URL", "OPENOUTREACH_API_KEY"]],
  ["stripe", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]],
  ["posthog", ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"]],
  ["metabase", ["METABASE_URL", "METABASE_SECRET_KEY"]],
  ["resend", ["RESEND_API_KEY"]],
] as const;
export function providerHealth() {
  return Object.fromEntries(providers.map(([name, keys]) => [name, { configured: keys.every(key => Boolean(process.env[key])), missing: keys.filter(key => !process.env[key]) }]));
}
