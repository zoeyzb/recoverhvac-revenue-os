"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/icon";
import "./owner-login.css";

export default function OwnerLogin(){
  const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent){ event.preventDefault(); setBusy(true); setError(""); const response=await fetch("/api/owner/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password})}); if(response.ok){location.href="/owner";return} const payload=await response.json().catch(()=>({})); setError(payload.error||"Access denied"); setBusy(false); }
  return <main className="owner-login"><Link href="/" className="login-home"><span><Icon name="wind" size={18}/></span><strong>Recover</strong></Link><section><div className="lock-mark"><Icon name="shield" size={22}/></div><small>PRIVATE OWNER WORKSPACE</small><h1>Revenue command center.</h1><p>Enter the owner password to view sales activity, outreach, automations, revenue attribution, and provider connections.</p><form onSubmit={submit}><label><span>Password</span><input autoFocus required minLength={8} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter owner password"/></label>{error&&<div className="login-error">{error}</div>}<button disabled={busy}>{busy?"Verifying…":"Open dashboard"}<Icon name="arrow" size={15}/></button></form><Link href="/">← Back to public website</Link></section></main>
}
