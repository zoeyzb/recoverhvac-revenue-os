import { describe, expect, it } from "vitest";
import {
  getPlan,
  getWalkthrough,
  plans,
  publishedTestimonials,
  testimonials,
  walkthroughs,
} from "./landing-content";

describe("landing content", () => {
  it("returns a stable fallback for an unknown walkthrough", () => {
    expect(getWalkthrough("not-a-workflow")).toEqual(walkthroughs[0]);
  });

  it("returns a stable fallback for an unknown plan", () => {
    expect(getPlan("not-a-plan")).toEqual(plans[1]);
  });

  it("keeps the three published prices explicit", () => {
    expect(plans.map((plan) => plan.price)).toEqual([
      "$297",
      "$997",
      "$1,997",
    ]);
  });

  it("never publishes an unverified testimonial", () => {
    expect(testimonials.some((item) => !item.verified)).toBe(true);
    expect(publishedTestimonials.every((item) => item.verified)).toBe(true);
    expect(publishedTestimonials).toHaveLength(0);
  });
});
