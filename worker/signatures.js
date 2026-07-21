const encoder = new TextEncoder();

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function hex(bytes) {
  return [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function hmac(algorithm, secret, message) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

export async function verifyStripeSignature({ body, header, secret, now = Date.now(), toleranceSeconds = 300 }) {
  if (!body || !header || !secret) return false;
  const fields = header.split(",").map(part => part.trim().split("=", 2));
  const timestamp = Number(fields.find(([key]) => key === "t")?.[1]);
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Math.floor(now / 1000) - timestamp) > toleranceSeconds) return false;
  const expected = encoder.encode(hex(await hmac("SHA-256", secret, `${timestamp}.${body}`)));
  return signatures.some(signature => equalBytes(expected, encoder.encode(signature.toLowerCase())));
}

export async function verifyTwilioSignature({ url, params, signature, authToken }) {
  if (!url || !signature || !authToken) return false;
  const entries = [...params.entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  const message = entries.reduce((value, [key, field]) => `${value}${key}${field}`, url);
  const digest = await hmac("SHA-1", authToken, message);
  const expected = Uint8Array.from(atob(signature), character => character.charCodeAt(0));
  return equalBytes(digest, expected);
}
