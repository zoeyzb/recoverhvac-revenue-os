import { createHash, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "recover_owner";

export function ownerToken(password: string, secret: string) {
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export function validOwnerPassword(candidate: string) {
  const password = process.env.OWNER_DASHBOARD_PASSWORD;
  const secret = process.env.OWNER_SESSION_SECRET;
  if (!password || !secret || !candidate) return false;
  const supplied = Buffer.from(ownerToken(candidate, secret));
  const expected = Buffer.from(ownerToken(password, secret));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
