import { describe, expect, it } from "vitest";
import { verifyStripeSignature, verifyTwilioSignature } from "./signatures.js";

async function stripeHeader(body: string, secret: string, timestamp: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
  const signature = [...digest].map(value=>value.toString(16).padStart(2,"0")).join("");
  return `t=${timestamp},v1=${signature}`;
}

describe("provider webhook signatures", () => {
  it("accepts a current Stripe signature over the untouched body", async () => {
    const body='{"id":"evt_1","type":"payment_intent.succeeded"}', secret="whsec_test", timestamp=1_720_000_000;
    expect(await verifyStripeSignature({body,secret,header:await stripeHeader(body,secret,timestamp),now:timestamp*1000})).toBe(true);
  });

  it("rejects a modified or stale Stripe payload", async () => {
    const body='{"id":"evt_1"}', secret="whsec_test", timestamp=1_720_000_000, header=await stripeHeader(body,secret,timestamp);
    expect(await verifyStripeSignature({body:'{"id":"evt_2"}',secret,header,now:timestamp*1000})).toBe(false);
    expect(await verifyStripeSignature({body,secret,header,now:(timestamp+301)*1000})).toBe(false);
  });

  it("matches Twilio's published form-signature vector", async () => {
    const params=new URLSearchParams({CallSid:"CA1234567890ABCDE",Caller:"+14158675310",Digits:"1234",From:"+14158675310",To:"+18005551212"});
    expect(await verifyTwilioSignature({url:"https://example.com/myapp.php?foo=1&bar=2",params,signature:"L/OH5YylLD5NRKLltdqwSvS0BnU=",authToken:"12345"})).toBe(true);
  });

  it("rejects a forged Twilio callback", async () => {
    expect(await verifyTwilioSignature({url:"https://example.com/webhook",params:new URLSearchParams({CallSid:"CA1"}),signature:"AAAAAAAAAAAAAAAAAAAAAAAAAAA=",authToken:"secret"})).toBe(false);
  });
});
