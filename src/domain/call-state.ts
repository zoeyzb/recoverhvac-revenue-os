export type CallEvent = { type: "initiated" | "ringing" | "answered" | "completed"; occurredAt: number };
export type CallState = "new" | "initiated" | "ringing" | "answered" | "completed_answered" | "completed_unanswered";

export function deriveCallState(events: CallEvent[]): CallState {
  if (!events.length) return "new";
  const types = new Set(events.map(event => event.type));
  if (types.has("completed")) return types.has("answered") ? "completed_answered" : "completed_unanswered";
  if (types.has("answered")) return "answered";
  if (types.has("ringing")) return "ringing";
  return "initiated";
}
