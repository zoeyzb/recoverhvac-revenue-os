"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import "@/app/account.css";

type Mode = "login" | "signup";

async function responsePayload(response: Response) {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw new Error("Sign in is temporarily unavailable. Please try again.");
  }
  return response.json() as Promise<{ data?: { emailConfirmationRequired?: boolean }; error?: { message?: string } }>;
}

export function AccountForm({ mode }: { mode: Mode }) {
  const signup = mode === "signup";
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName, email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      const payload = await responsePayload(response);
      if (!response.ok) throw new Error(payload.error?.message || `Could not ${signup ? "create your account" : "sign in"}`);
      if (signup && payload.data?.emailConfirmationRequired) {
        setNotice("Your workspace is ready. Check your email to confirm the account, then sign in.");
        setBusy(false);
        return;
      }
      window.location.assign("/app");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return <main className="account-page">
    <section className="account-aside">
      <Link href="/" className="account-brand"><span>R</span><strong>Recover</strong></Link>
      <div><span className="account-kicker">{signup ? "START IN TEST MODE" : "WELCOME BACK"}</span><h1>{signup ? <>Your front office,<br/><em>finally connected.</em></> : <>Pick up where<br/><em>your team left off.</em></>}</h1><p>{signup ? "Create your organization, then connect calls, messages, calendars, website monitoring, and revenue—one piece at a time." : "Open conversations, bookings, automations, website findings, and verified revenue from one workspace."}</p></div>
      <ul><li><Icon name="shield" size={16}/> Nothing sends during setup</li><li><Icon name="check" size={16}/> No credit card to create a workspace</li><li><Icon name="workflow" size={16}/> Your connected data stays organization-scoped</li></ul>
    </section>
    <section className="account-main">
      <div className="account-card">
        <div className="account-card-head"><span>{signup ? "CREATE ACCOUNT" : "ACCOUNT LOGIN"}</span><Link href="/">Close</Link></div>
        <h2>{signup ? "Create your workspace" : "Log in to Recover"}</h2>
        <p>{signup ? "Start with a private, empty workspace. We never insert fake leads or results." : "Use the email and password attached to your organization."}</p>
        <form onSubmit={submit} noValidate={false}>
          {signup && <label><span>Business name</span><input required minLength={2} maxLength={160} autoComplete="organization" value={businessName} onChange={event=>setBusinessName(event.target.value)} placeholder="Northstar Services"/></label>}
          <label><span>Work email</span><input required type="email" inputMode="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@company.com"/></label>
          <label><span>Password</span><input required type="password" minLength={signup ? 10 : 8} maxLength={256} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={event=>setPassword(event.target.value)} placeholder={signup ? "At least 10 characters" : "Your password"}/></label>
          {error && <div className="account-message error" role="alert"><Icon name="shield" size={15}/>{error}</div>}
          {notice && <div className="account-message success" role="status"><Icon name="check" size={15}/>{notice}</div>}
          <button disabled={busy}>{busy ? (signup ? "Creating workspace…" : "Signing in…") : (signup ? "Create workspace" : "Log in")}<Icon name="arrow" size={16}/></button>
        </form>
        <div className="account-switch">{signup ? "Already have an account?" : "New to Recover?"}<Link href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create a workspace"}</Link></div>
      </div>
    </section>
  </main>;
}
