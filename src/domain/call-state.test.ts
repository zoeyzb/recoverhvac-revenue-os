import { describe, expect, it } from "vitest";
import { deriveCallState } from "./call-state";
describe("call state",()=>{
  it("handles answered calls",()=>expect(deriveCallState([{type:"answered",occurredAt:2},{type:"completed",occurredAt:3}])).toBe("completed_answered"));
  it("handles unanswered calls",()=>expect(deriveCallState([{type:"ringing",occurredAt:1},{type:"completed",occurredAt:2}])).toBe("completed_unanswered"));
  it("is stable when callbacks arrive out of order",()=>expect(deriveCallState([{type:"completed",occurredAt:3},{type:"initiated",occurredAt:1},{type:"answered",occurredAt:2}])).toBe("completed_answered"));
});
