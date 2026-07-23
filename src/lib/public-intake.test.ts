import { describe, expect, it } from "vitest";
import { parsePublicIntake } from "./public-intake";

const valid = {
  name: "Alex Morgan",
  businessName: "Northstar Services",
  phone: "3125550100",
  email: "Alex@Example.com",
  industry: "Plumbing",
  city: "Chicago",
  websiteUrl: "https://example.com",
  needs: ["Missed calls"],
  service: "front-office",
};

describe("public recovery intake", () => {
  it("normalizes a valid request", () => {
    expect(parsePublicIntake(valid)).toMatchObject({
      email: "alex@example.com",
      websiteUrl: "https://example.com/",
      needs: ["Missed calls"],
      service: "front-office",
    });
  });

  it("requires a revenue leak", () => {
    expect(() => parsePublicIntake({ ...valid, needs: [] })).toThrow(
      "Choose at least one revenue leak",
    );
  });

  it("allows a business without a website", () => {
    expect(
      parsePublicIntake({
        ...valid,
        websiteUrl: "",
        noWebsite: true,
      }).websiteUrl,
    ).toBeNull();
  });
});
