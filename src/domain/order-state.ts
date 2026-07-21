export type OrderStatus = "queued" | "auditing" | "review" | "approved" | "contacting" | "replied" | "booked" | "paid" | "blocked" | "failed";

type TransitionEvidence = { approvalId?: string; providerRef?: string; verifiedEventId?: string; reason?: string };

const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
  queued: ["auditing", "blocked", "failed"], auditing: ["review", "blocked", "failed"],
  review: ["approved", "blocked", "failed"], approved: ["contacting", "blocked", "failed"],
  contacting: ["replied", "blocked", "failed"], replied: ["contacting", "booked", "blocked", "failed"],
  booked: ["paid", "blocked", "failed"], paid: [], blocked: ["review", "failed"], failed: ["queued", "review"],
};

export function transitionOrder(current: OrderStatus, next: OrderStatus, evidence: TransitionEvidence) {
  if (!allowed[current].includes(next)) throw new Error(`Invalid order transition: ${current} → ${next}`);
  if (next === "approved" && !evidence.approvalId) throw new Error("Approval requires approval evidence");
  if (next === "contacting" && !evidence.providerRef) throw new Error("Contacting requires a provider reference");
  if ((next === "booked" || next === "paid") && !evidence.providerRef) throw new Error(`${next} requires a provider reference`);
  if ((next === "booked" || next === "paid") && !evidence.verifiedEventId) throw new Error(`${next} requires a verified provider event`);
  if ((next === "blocked" || next === "failed") && !evidence.reason) throw new Error(`${next} requires a reason`);
  return { previous: current, next, evidence, changedAt: new Date().toISOString() };
}
