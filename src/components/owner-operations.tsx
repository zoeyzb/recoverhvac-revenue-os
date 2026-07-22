"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import "@/app/owner.css";

type Section =
  | "Command"
  | "Discovery"
  | "Leads"
  | "Audits"
  | "Approvals"
  | "Outreach"
  | "Conversations"
  | "Calls"
  | "Pipeline"
  | "Meetings"
  | "Orders"
  | "Customers"
  | "Automations"
  | "Integrations"
  | "Costs"
  | "Compliance"
  | "System";

const groups: { label: string; items: Section[] }[] = [
  { label: "Command", items: ["Command", "Approvals", "System"] },
  { label: "Acquisition", items: ["Discovery", "Leads", "Audits", "Outreach"] },
  { label: "Sales", items: ["Conversations", "Calls", "Pipeline", "Meetings", "Orders"] },
  { label: "Customers", items: ["Customers", "Automations"] },
  { label: "Operations", items: ["Integrations", "Costs", "Compliance"] },
];

const statusCards = [
  ["Discovery worker", "Not connected", "Connect the Railway maps worker before scheduled searches can run."],
  ["Audit worker", "Not connected", "Lighthouse and Playwright need a persistent browser worker."],
  ["Outbound channels", "Test mode", "No live call, SMS, or campaign can run until providers and policy are verified."],
  ["Revenue evidence", "Awaiting data", "Stripe and customer systems have not produced a verified payment event."],
] as const;

const flow = [
  "Discover service businesses",
  "Normalize, deduplicate, and enrich",
  "Run website and local-conversion audit",
  "Score opportunity with evidence",
  "Generate an audit and channel plan",
  "Check DNC, quiet hours, limits, and approval",
  "Contact, interpret replies, and follow up",
  "Book a meeting or start checkout",
  "Provision the customer workspace",
  "Operate recovery and measure verified revenue",
] as const;

function EmptyPanel({ title, body, action }: { title: string; body: string; action: string }) {
  return (
    <section className="owner-empty">
      <span>REAL DATA ONLY</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <button type="button">{action}</button>
    </section>
  );
}

function CommandView() {
  return (
    <>
      <section className="owner-hero">
        <div>
          <span className="owner-eyebrow">PRIVATE OPERATOR CONTROL CENTER</span>
          <h1>Run acquisition, sales, onboarding, and customer recovery from one place.</h1>
          <p>
            Recover prepares the work automatically. Live outreach remains blocked until provider credentials,
            safety policy, and the required approval state are valid.
          </p>
        </div>
        <div className="owner-mode"><b>TEST MODE</b><span>External actions fail closed</span></div>
      </section>

      <section className="owner-status-grid">
        {statusCards.map(([title, state, detail]) => (
          <article key={title}>
            <span>{title}</span>
            <strong>{state}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="owner-split">
        <article className="owner-panel">
          <header><div><span>OPERATING LOOP</span><h2>Hands-off preparation. Controlled execution.</h2></div></header>
          <ol className="owner-flow">
            {flow.map((item, index) => <li key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></li>)}
          </ol>
        </article>
        <article className="owner-panel">
          <header><div><span>NEEDS ATTENTION</span><h2>Nothing is being hidden.</h2></div></header>
          <div className="owner-attention">
            <div><b>Authentication setup</b><p>Supabase variables and migrations must be complete before customer accounts work.</p><em>Blocked</em></div>
            <div><b>Worker networking</b><p>Railway must expose the webhook/API service and run dedicated worker commands.</p><em>Blocked</em></div>
            <div><b>Provider connections</b><p>Twilio, LiveKit, OpenAI, Twenty, Activepieces, and outreach providers are not verified.</p><em>Required</em></div>
          </div>
        </article>
      </section>
    </>
  );
}

function DiscoveryView() {
  return (
    <section className="owner-panel owner-form-panel">
      <header><div><span>ACQUISITION</span><h2>Business discovery</h2><p>Create a saved search for one niche and metro. Results must be normalized, deduplicated, and checked against suppression before audit.</p></div><button type="button">Run discovery</button></header>
      <div className="owner-form-grid">
        <label><span>Niche</span><input defaultValue="HVAC" /></label>
        <label><span>Metro area</span><input placeholder="Dallas, Texas" /></label>
        <label><span>Radius</span><select defaultValue="40"><option value="20">20 miles</option><option value="40">40 miles</option><option value="75">75 miles</option></select></label>
        <label><span>Maximum leads</span><input type="number" defaultValue={100} min={1} max={1000} /></label>
      </div>
      <div className="owner-query-list"><span>Search library</span>{["HVAC contractor", "AC repair", "Air-conditioning repair", "Furnace repair", "Emergency HVAC", "Heat pump repair"].map(item => <b key={item}>{item}</b>)}</div>
      <div className="owner-warning">Discovery cannot run until the maps worker has a public internal endpoint and a valid shared secret.</div>
    </section>
  );
}

function LeadsView() {
  return (
    <section className="owner-panel">
      <header><div><span>QUALIFICATION</span><h2>Leads</h2><p>Every lead needs public-source evidence, duplicate checks, score reasons, and outreach readiness.</p></div></header>
      <div className="owner-table-wrap"><table><thead><tr><th>Business</th><th>Website</th><th>Contact</th><th>Score</th><th>Audit</th><th>Outreach</th><th>Stage</th></tr></thead><tbody><tr><td colSpan={7}>No discovery run has produced verified leads yet.</td></tr></tbody></table></div>
    </section>
  );
}

function AuditsView() {
  return <EmptyPanel title="Audit queue" body="This view will show Lighthouse, Playwright, screenshots, HVAC-specific checks, evidence JSON, AI summaries, and public audit publication state. No audit worker is connected yet." action="Connect audit worker" />;
}

function ApprovalsView() {
  return <EmptyPanel title="First-touch approvals" body="Recover will prepare the evidence-backed offer, email, SMS, and call plan automatically. The first live contact stays blocked until you approve the plan and policy passes." action="Review policy settings" />;
}

function GenericView({ section }: { section: Section }) {
  const copy: Partial<Record<Section, [string, string, string]>> = {
    Outreach: ["Outreach control", "Campaigns, drafts, replies, stop-on-reply state, next action, delivery evidence, and costs will appear here.", "Connect outreach provider"],
    Conversations: ["Unified conversations", "Internal prospect outreach and customer communication will be clearly labeled and never mixed without context.", "Connect messaging"],
    Calls: ["Calls and transcripts", "See direction, agent version, disclosure, recording state, transcript, summary, outcome, transfer, DNC, provider ID, and cost.", "Connect Twilio and LiveKit"],
    Pipeline: ["Sales pipeline", "Twenty remains the sales source of truth from Discovered through Recurring Customer.", "Connect Twenty"],
    Meetings: ["Meetings", "Positive replies should offer real availability, book a meeting, stop unrelated follow-ups, and prepare a briefing.", "Connect calendar"],
    Orders: ["Orders and conversion", "Track checkout, deposits, subscriptions, intake, workspace provisioning, refunds, and launch state.", "Connect Stripe"],
    Customers: ["Customer workspaces", "Provision and inspect each organization without exposing platform credentials or mixing tenant data.", "Create from verified sale"],
    Automations: ["Automation runtime", "Inspect queued, running, waiting, approval, completed, failed, cancelled, and dead-letter work.", "Open runtime settings"],
    Integrations: ["Platform integrations", "These are owner-only platform connections. Customer-owned phone, calendar, CRM, and field-service connections stay inside each customer workspace.", "Configure platform"],
    Costs: ["Cost ledger", "Provider usage, cost per lead, cost per audit, cost per conversation, and cost per sale require verified events.", "Connect providers"],
    Compliance: ["Safety and compliance", "Control DNC, first-touch approval, quiet hours, channel caps, cooldowns, audit trails, and emergency kill switches.", "Review controls"],
    System: ["System health", "See authentication, migrations, webhooks, worker heartbeats, retries, dead letters, integrations, and deployment health.", "Run readiness check"],
  };
  const [title, body, action] = copy[section] ?? [section, "This owner-only area is ready for its live data adapter.", "Configure"];
  return <EmptyPanel title={title} body={body} action={action} />;
}

export default function OwnerOperations() {
  const [section, setSection] = useState<Section>("Command");
  const content = useMemo(() => {
    if (section === "Command") return <CommandView />;
    if (section === "Discovery") return <DiscoveryView />;
    if (section === "Leads") return <LeadsView />;
    if (section === "Audits") return <AuditsView />;
    if (section === "Approvals") return <ApprovalsView />;
    return <GenericView section={section} />;
  }, [section]);

  return (
    <main className="owner-shell">
      <aside className="owner-sidebar">
        <Link href="/" className="owner-brand"><span>R</span><div><strong>Recover</strong><small>Operator OS</small></div></Link>
        <nav>
          {groups.map(group => <div key={group.label}><span>{group.label}</span>{group.items.map(item => <button type="button" key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}</div>)}
        </nav>
        <div className="owner-sidebar-foot"><span>Private platform access</span><Link href="/app">Open customer workspace</Link></div>
      </aside>
      <section className="owner-main">
        <header className="owner-topbar"><div><span>Recover internal operations</span><strong>{section}</strong></div><div className="owner-top-actions"><button type="button">Emergency stop</button><Link href="/">Public site</Link></div></header>
        <div className="owner-content">{content}</div>
      </section>
    </main>
  );
}
