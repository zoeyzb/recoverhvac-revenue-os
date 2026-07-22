import { afterEach, describe, expect, it } from "vitest";
import { ownerToken, validOwnerPassword } from "./owner-auth";

const originalPassword = process.env.OWNER_DASHBOARD_PASSWORD;
const originalSecret = process.env.OWNER_SESSION_SECRET;
afterEach(() => {
  process.env.OWNER_DASHBOARD_PASSWORD = originalPassword;
  process.env.OWNER_SESSION_SECRET = originalSecret;
});

describe("owner dashboard authentication", () => {
  it("fails closed when owner access is not configured", () => {
    delete process.env.OWNER_DASHBOARD_PASSWORD;
    delete process.env.OWNER_SESSION_SECRET;
    expect(validOwnerPassword("anything-here")).toBe(false);
  });
  it("accepts only the configured password", () => {
    process.env.OWNER_DASHBOARD_PASSWORD = "correct-password";
    process.env.OWNER_SESSION_SECRET = "a-long-random-session-secret";
    expect(validOwnerPassword("correct-password")).toBe(true);
    expect(validOwnerPassword("incorrect-password")).toBe(false);
  });
  it("binds tokens to password and secret", () => {
    expect(ownerToken("password", "secret-a")).not.toBe(ownerToken("password", "secret-b"));
    expect(ownerToken("password-a", "secret-a")).toBe(ownerToken("password-b", "secret-a"));
  });
});
