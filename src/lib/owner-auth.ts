import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "recover_owner";

export function ownerToken(password: string, secret: string) {
  void password;
  return createHmac("sha256", secret).update("recover-owner-session-v1").digest("hex");
}

export function validOwnerPassword(candidate: string) {
  const password = process.env.OWNER_DASHBOARD_PASSWORD;
  const secret = process.env.OWNER_SESSION_SECRET;
  if (!password || !secret || !candidate) return false;
  const supplied = createHash("sha256").update(candidate).digest();
  const expected = createHash("sha256").update(password).digest();
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
