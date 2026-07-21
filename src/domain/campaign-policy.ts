export type CampaignPolicyInput = {
  businessIdentityVerified: boolean;
  businessLineVerified: boolean;
  sourceEvidencePresent: boolean;
  firstTouchApproved: boolean;
  assistantDisclosureEnabled: boolean;
  optOutMechanismEnabled: boolean;
  humanTransferAvailable: boolean;
  suppressed: boolean;
  insidePermittedHours: boolean;
  priorAttempts: number;
  maxAttempts: number;
  idempotencyKey: string;
};

export function evaluateCampaignCall(input: CampaignPolicyInput) {
  const reasons: string[] = [];
  if (!input.businessIdentityVerified) reasons.push("BUSINESS_IDENTITY_UNVERIFIED");
  if (!input.businessLineVerified) reasons.push("BUSINESS_LINE_UNVERIFIED");
  if (!input.sourceEvidencePresent) reasons.push("SOURCE_EVIDENCE_REQUIRED");
  if (!input.firstTouchApproved) reasons.push("FIRST_TOUCH_APPROVAL_REQUIRED");
  if (!input.assistantDisclosureEnabled) reasons.push("ASSISTANT_DISCLOSURE_REQUIRED");
  if (!input.optOutMechanismEnabled) reasons.push("OPT_OUT_REQUIRED");
  if (!input.humanTransferAvailable) reasons.push("HUMAN_TRANSFER_REQUIRED");
  if (input.suppressed) reasons.push("SUPPRESSED");
  if (!input.insidePermittedHours) reasons.push("CALLING_HOURS");
  if (input.priorAttempts >= input.maxAttempts) reasons.push("ATTEMPT_LIMIT");
  if (!input.idempotencyKey.trim()) reasons.push("IDEMPOTENCY_KEY_REQUIRED");
  return { allowed: reasons.length === 0, code: reasons[0] ?? "ALLOWED", reasons };
}
