import { describe, expect, it } from "vitest";
import runtimeWorker from "../../../../worker/index.js";

describe("operational route adapter", () => {
  it("returns structured JSON for an unknown API route", async () => {
    const response = await runtimeWorker.fetch(
      new Request("https://recover.example/api/does-not-exist"),
      {},
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("serves the public catalog without a separate backend", async () => {
    const response = await runtimeWorker.fetch(
      new Request("https://recover.example/api/catalog"),
      {},
    );
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data.length).toBeGreaterThan(10);
  });
});
