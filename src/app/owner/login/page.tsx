"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/icon";
import "./owner-login.css";

export default function OwnerLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Owner sign-in failed.");
      const requested = new URLSearchParams(window.location.search).get("next") || "/owner";
      window.location.assign(requested.startsWith("/owner") && !requested.startsWith("/owner/login") ? requested : "/owner");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Owner sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <main className="owner-login">
      <Link href="/" className="login-home"><span><Icon name="wind" size={18} /></span><div><strong>Recover</strong><small>INTERNAL ADMIN</small></div></Link>
      <section>
        <div className="login-kicker"><span className="lock-mark"><Icon name="shield" size={20} /></span><small>PRIVATE OWNER WORKSPACE</small></div>
        <h1>Revenue command center.</h1>
        <p>Open recovery activity, conversations, approvals, attributed revenue, workflow health, and provider connections.</p>
        <form onSubmit={submit}>
          <label htmlFor="owner-password">Owner password</label>
          <div className="password-field">
            <input id="owner-password" autoFocus required maxLength={256} type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
            <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
          </div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" disabled={busy || !password}>{busy ? "Verifying…" : "Open dashboard"}<Icon name="arrow" size={15} /></button>
        </form>
        <div className="login-support"><Icon name="shield" size={13} /><span>Encrypted, HTTP-only owner session. Your password is never stored in the browser.</span></div>
        <Link href="/">← Back to public website</Link>
      </section>
    </main>
  );
}
