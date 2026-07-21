import { describe, expect, it } from "vitest";
import { CampaignPolicyInput, evaluateCampaignCall } from "./campaign-policy";

const valid: CampaignPolicyInput = {
  businessIdentityVerified: true, businessLineVerified: true, sourceEvidencePresent: true,
  firstTouchApproved: true, assistantDisclosureEnabled: true, optOutMechanismEnabled: true,
  humanTransferAvailable: true, suppressed: false, insidePermittedHours: true,
  priorAttempts: 0, maxAttempts: 2, idempotencyKey: "campaign:company:1",
};

describe("campaign call policy", () => {
  it("allows an evidenced and controlled business call", () => expect(evaluateCampaignCall(valid).allowed).toBe(true));
  it("blocks undisclosed automation", () => expect(evaluateCampaignCall({...valid, assistantDisclosureEnabled:false}).code).toBe("ASSISTANT_DISCLOSURE_REQUIRED"));
  it("blocks suppressed businesses", () => expect(evaluateCampaignCall({...valid, suppressed:true}).code).toBe("SUPPRESSED"));
  it("blocks repeated dialing beyond the configured limit", () => expect(evaluateCampaignCall({...valid, priorAttempts:2}).code).toBe("ATTEMPT_LIMIT"));
  it("requires a human handoff path", () => expect(evaluateCampaignCall({...valid, humanTransferAvailable:false}).reasons).toContain("HUMAN_TRANSFER_REQUIRED"));
});
