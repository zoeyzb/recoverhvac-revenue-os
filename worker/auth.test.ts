import { describe, expect, it } from "vitest";
import { cookieValue, sessionCookies, validRole } from "./auth.js";

describe("authentication boundary", () => {
  it("reads exact cookie names without accepting prefixes", () => {
    const header="other_recover_access=wrong; recover_access=correct; recover_refresh=refresh";
    expect(cookieValue(header,"recover_access")).toBe("correct");
    expect(cookieValue(header,"recover_refresh")).toBe("refresh");
    expect(cookieValue(header,"access")).toBe("");
  });

  it("creates httpOnly secure same-site cookies", () => {
    const cookies=sessionCookies({access_token:"access",refresh_token:"refresh",expires_in:3600});
    expect(cookies).toHaveLength(2);
    expect(cookies.every(cookie=>cookie.includes("HttpOnly")&&cookie.includes("Secure")&&cookie.includes("SameSite=Lax"))).toBe(true);
  });

  it("accepts only known organization roles", () => {
    expect(validRole("owner")).toBe(true);
    expect(validRole("viewer")).toBe(true);
    expect(validRole("root")).toBe(false);
  });
});
