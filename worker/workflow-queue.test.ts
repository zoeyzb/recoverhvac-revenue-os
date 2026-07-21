import { describe, expect, it } from "vitest";
import { authorizeWorker, retryDelaySeconds } from "./workflow-queue.js";

describe("workflow queue controls", () => {
  it("uses bounded exponential retry delays", () => {
    expect(retryDelaySeconds(1)).toBe(60);
    expect(retryDelaySeconds(2)).toBe(120);
    expect(retryDelaySeconds(8)).toBe(3600);
    expect(retryDelaySeconds(99)).toBe(3600);
  });

  it("requires an exact bearer secret", () => {
    expect(authorizeWorker("Bearer correct", "correct")).toBe(true);
    expect(authorizeWorker("Bearer wrong", "correct")).toBe(false);
    expect(authorizeWorker("correct", "correct")).toBe(false);
    expect(authorizeWorker("Bearer correct", "")).toBe(false);
  });
});
