import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "recover_owner";

export function ownerToken(_password: string, secret: string) {
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

export function validOwnerToken(candidate: string | undefined) {
  const password = process.env.OWNER_DASHBOARD_PASSWORD;
  const secret = process.env.OWNER_SESSION_SECRET;
  if (!password || !secret || !candidate) return false;
  const supplied = Buffer.from(candidate);
  const expected = Buffer.from(ownerToken(password, secret));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
