export type Channel = "sms" | "email" | "voice";
export type PolicyInput = {
  globalEnabled: boolean;
  tenantEnabled: boolean;
  channelEnabled: boolean;
  testMode: boolean;
  recipientAllowlisted: boolean;
  suppressed: boolean;
  consentValid: boolean;
  insideQuietHours: boolean;
  underDailyLimit: boolean;
  idempotencyKey: string;
};
export type PolicyDecision = { allowed: boolean; code: string; reasons: string[] };

export function evaluateCommunication(input: PolicyInput): PolicyDecision {
  const reasons: string[] = [];
  if (!input.globalEnabled) reasons.push("GLOBAL_DISABLED");
  if (!input.tenantEnabled) reasons.push("TENANT_DISABLED");
  if (!input.channelEnabled) reasons.push("CHANNEL_DISABLED");
  if (input.testMode && !input.recipientAllowlisted) reasons.push("TEST_RECIPIENT_REQUIRED");
  if (input.suppressed) reasons.push("SUPPRESSED");
  if (!input.consentValid) reasons.push("CONSENT_REQUIRED");
  if (input.insideQuietHours) reasons.push("QUIET_HOURS");
  if (!input.underDailyLimit) reasons.push("DAILY_LIMIT");
  if (!input.idempotencyKey.trim()) reasons.push("IDEMPOTENCY_KEY_REQUIRED");
  return { allowed: reasons.length === 0, code: reasons.length ? reasons[0] : "ALLOWED", reasons };
}
