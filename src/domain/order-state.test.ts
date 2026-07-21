import { describe, expect, it } from "vitest";
import { transitionOrder } from "./order-state";

describe("recovery order state machine", () => {
  it("allows the verified happy path", () => {
    expect(transitionOrder("review", "approved", { approvalId: "approval-1" }).next).toBe("approved");
    expect(transitionOrder("approved", "contacting", { providerRef: "call-1" }).next).toBe("contacting");
    expect(transitionOrder("replied", "booked", { providerRef: "appointment-1", verifiedEventId: "event-1" }).next).toBe("booked");
    expect(transitionOrder("booked", "paid", { providerRef: "payment-1", verifiedEventId: "event-2" }).next).toBe("paid");
  });

  it("requires approval evidence before outreach", () => {
    expect(() => transitionOrder("review", "approved", {})).toThrow("approval evidence");
  });

  it("requires provider truth for external outcomes", () => {
    expect(() => transitionOrder("replied", "booked", { providerRef: "appointment-1" })).toThrow("verified provider event");
    expect(() => transitionOrder("booked", "paid", { verifiedEventId: "event-1" })).toThrow("provider reference");
  });

  it("rejects impossible jumps", () => {
    expect(() => transitionOrder("review", "paid", { providerRef: "payment-1", verifiedEventId: "event-1" })).toThrow("Invalid order transition");
  });
});
