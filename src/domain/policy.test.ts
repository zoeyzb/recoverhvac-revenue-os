import { describe, expect, it } from "vitest";
import { evaluateCommunication, PolicyInput } from "./policy";
const allowed: PolicyInput = { globalEnabled:true,tenantEnabled:true,channelEnabled:true,testMode:true,recipientAllowlisted:true,suppressed:false,consentValid:true,insideQuietHours:false,underDailyLimit:true,idempotencyKey:"job-1" };
describe("communication policy",()=>{
  it("allows a fully compliant test recipient",()=>expect(evaluateCommunication(allowed)).toEqual({allowed:true,code:"ALLOWED",reasons:[]}));
  it("fails closed when globally disabled",()=>expect(evaluateCommunication({...allowed,globalEnabled:false}).code).toBe("GLOBAL_DISABLED"));
  it("never allows suppressed contacts",()=>expect(evaluateCommunication({...allowed,suppressed:true}).reasons).toContain("SUPPRESSED"));
  it("requires allowlisting in test mode",()=>expect(evaluateCommunication({...allowed,recipientAllowlisted:false}).allowed).toBe(false));
});
