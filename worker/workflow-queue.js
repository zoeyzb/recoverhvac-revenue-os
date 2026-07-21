export function retryDelaySeconds(attempt) {
  const safeAttempt = Math.max(1, Math.floor(Number(attempt) || 1));
  return Math.min(3600, 60 * (2 ** (safeAttempt - 1)));
}

export function authorizeWorker(header, secret) {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  if (supplied.length !== secret.length) return false;
  let difference = 0;
  for (let index = 0; index < secret.length; index += 1) {
    difference |= supplied.charCodeAt(index) ^ secret.charCodeAt(index);
  }
  return difference === 0;
}
