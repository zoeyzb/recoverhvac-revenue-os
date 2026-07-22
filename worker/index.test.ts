import { describe, expect, it, vi } from "vitest";
vi.mock("./auth.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./auth.js")>();
  return {
    ...actual,
    resolveContext: vi.fn(async () => ({
      user: { id: "user-1", email: "owner@example.com" },
      tenantId: "00000000-0000-0000-0000-000000000001",
      role: "owner",
      organization: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Test HVAC",
      },
    })),
  };
});
import worker from "./index.js";

const assets = { fetch: vi.fn(() => Promise.resolve(new Response("asset"))) };

describe("integration backend", () => {
  it("rejects a malformed signup email before calling Supabase", async () => {
    const providerFetch = vi.spyOn(globalThis, "fetch");
    const response = await worker.fetch(
      new Request("https://local/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://local" },
        body: JSON.stringify({
          businessName: "Northstar Services",
          email: "Bepashkumarsingh@1",
          password: "long-enough-password",
        }),
      }),
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        ASSETS: assets,
      },
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR", message: "Enter a valid email address" },
    });
    expect(providerFetch).not.toHaveBeenCalled();
    providerFetch.mockRestore();
  });

  it("creates a customer, organization, owner membership, safe settings and templates", async () => {
    const providerFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: { id: "user-1", email: "owner@example.com", identities: [{ id: "identity-1" }] },
            access_token: "access",
            refresh_token: "refresh",
            expires_in: 3600,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "org-1", name: "Northstar Services" }]), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))
      .mockResolvedValueOnce(new Response("", { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const response = await worker.fetch(
      new Request("https://local/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://local" },
        body: JSON.stringify({
          businessName: "Northstar Services",
          email: "OWNER@example.com",
          password: "long-enough-password",
          timezone: "America/Chicago",
        }),
      }),
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        ASSETS: assets,
      },
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("recover_access=");
    await expect(response.json()).resolves.toMatchObject({
      data: { accountCreated: true, organization: { id: "org-1", name: "Northstar Services" } },
    });
    expect(providerFetch).toHaveBeenCalledTimes(5);
    expect(String(providerFetch.mock.calls[2]?.[0])).toContain("organization_members");
    expect(String(providerFetch.mock.calls[3]?.[0])).toContain("automation_settings");
    expect(String(providerFetch.mock.calls[4]?.[0])).toContain("seed_recovery_templates");
    providerFetch.mockRestore();
  });
  it("authenticates the owner through the packaged worker and protects owner assets", async () => {
    const env={ASSETS:assets,OWNER_DASHBOARD_PASSWORD:"owner-password",OWNER_SESSION_SECRET:"long-random-owner-session-secret"};
    const blocked=await worker.fetch(new Request("https://local/owner/"),env);
    expect(blocked.status).toBe(302);
    expect(blocked.headers.get("location")).toContain("/owner/login");

    const login=await worker.fetch(new Request("https://local/api/owner/login",{method:"POST",headers:{"content-type":"application/json","origin":"https://local"},body:JSON.stringify({password:"owner-password"})}),env);
    expect(login.status).toBe(200);
    const setCookie=login.headers.get("set-cookie")||"";
    expect(setCookie).toContain("recover_owner=");
    expect(setCookie).toContain("HttpOnly");

    const cookie=setCookie.split(";")[0];
    const allowed=await worker.fetch(new Request("https://local/owner/",{headers:{cookie}}),env);
    expect(allowed.status).toBe(200);
    await expect(allowed.text()).resolves.toBe("asset");
  });

  it("explains when deployed owner authentication is not configured", async () => {
    const response=await worker.fetch(new Request("https://local/api/owner/login",{method:"POST",headers:{"content-type":"application/json","origin":"https://local"},body:JSON.stringify({password:"anything"})}),{ASSETS:assets});
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({code:"OWNER_AUTH_NOT_CONFIGURED"});
  });

  it("returns truthful unconfigured provider state", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/integrations"),
      { ASSETS: assets },
    );
    const payload = (await response.json()) as {
      data: { configured: boolean; fields: unknown[] }[];
    };
    expect(payload.data.length).toBeGreaterThanOrEqual(28);
    expect(payload.data.every((item) => item.configured === false)).toBe(true);
    expect(payload.data.every((item) => item.fields.length > 0)).toBe(true);
  });

  it("rejects incomplete integration credentials without external calls", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/integrations/twilio/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentials: {} }),
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "CONNECTION_FAILED" },
    });
  });

  it("does not expose credential values in provider discovery", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/integrations"),
      { OPENAI_API_KEY: "secret-value", ASSETS: assets },
    );
    const text = await response.text();
    expect(text).not.toContain("secret-value");
    expect(
      JSON.parse(text).data.find((item: { id: string }) => item.id === "openai")
        .configured,
    ).toBe(true);
  });

  it("blocks outbound communication to recipients outside the allowlist", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/actions/email/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: "stranger@example.com",
          content: "Test",
        }),
      }),
      { TEST_RECIPIENTS: "owner@example.com", ASSETS: assets },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: expect.stringContaining("allowlist") },
    });
  });

  it("requires a configured AI provider for analysis", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/actions/analysis/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Customer needs emergency cooling." }),
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "OpenAI is not configured" },
    });
  });

  it("requires a configured AI provider for operator planning", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/actions/operator/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: "Missed call with consent status unknown.",
        }),
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "OpenAI is not configured" },
    });
  });

  it("rejects private or insecure audit targets", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/growth/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: "Internal",
          domain: "http://127.0.0.1",
        }),
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "AUDIT_FAILED" },
    });
  });

  it("returns an honest empty order list when persistence is unavailable", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/orders"),
      { ASSETS: assets },
    );
    await expect(response.json()).resolves.toEqual({
      data: [],
      persistence: "unavailable",
    });
  });

  it("refuses to create a disposable autopilot order without persistence", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/growth/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme HVAC",
          domain: "https://example.com",
        }),
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "PERSISTENCE_REQUIRED" },
    });
  });

  it("identifies the automated assistant in a test call and escapes spoken content", async () => {
    const providerFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sid: "CA123" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );
    const response = await worker.fetch(
      new Request("https://local/api/actions/call/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: "+13125550123",
          content: "Testing A & B <safe>",
        }),
      }),
      {
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token",
        TWILIO_PHONE_NUMBER: "+13125550000",
        TEST_RECIPIENTS: "+13125550123",
        ASSETS: assets,
      },
    );
    expect(response.status).toBe(200);
    const sent = providerFetch.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(sent.get("Twiml")).toContain("automated assistant for your business through Recover");
    expect(sent.get("Twiml")).toContain("A &amp; B &lt;safe&gt;");
    providerFetch.mockRestore();
  });

  it("protects the event processor with a server-side bearer secret", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/internal/events/process", {
        method: "POST",
      }),
      { WORKER_SHARED_SECRET: "correct", ASSETS: assets },
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("protects voice tools with a separate server-side bearer secret", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/internal/voice/tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "record_outcome" }),
      }),
      { VOICE_AGENT_SHARED_SECRET: "correct", ASSETS: assets },
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("fails closed when the Twilio messaging webhook is not configured", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/webhooks/twilio/messages", {
        method: "POST",
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "WEBHOOK_NOT_CONFIGURED" },
    });
  });

  it("fails closed when an authorized event processor has no durable queue", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/internal/events/process", {
        method: "POST",
        headers: {
          authorization: "Bearer correct",
          "content-type": "application/json",
        },
        body: "{}",
      }),
      { WORKER_SHARED_SECRET: "correct", ASSETS: assets },
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "QUEUE_PROCESSING_FAILED" },
    });
  });

  it("returns an honest empty operations center without persistence", async () => {
    const response = await worker.fetch(
      new Request("https://local/api/operations"),
      { ASSETS: assets },
    );
    await expect(response.json()).resolves.toEqual({
      data: { approvals: [], failures: [], appointments: [], payments: [] },
      persistence: "unavailable",
    });
  });

  it("rejects approval decisions without durable storage", async () => {
    const response = await worker.fetch(
      new Request(
        "https://local/api/approvals/00000000-0000-0000-0000-000000000001/decision",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: "approved" }),
        },
      ),
      { ASSETS: assets },
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "PERSISTENCE_REQUIRED" },
    });
  });
});
