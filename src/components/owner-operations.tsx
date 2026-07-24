"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "@/app/owner.css";

type Section = "Command" | "Acquisition" | "Sales" | "Customers" | "Operations";
type Check = {
  id: string;
  name: string;
  state: "ready" | "attention" | "optional";
  detail: string;
  source: string;
};
type Readiness = {
  checks: Check[];
  ready: number;
  attention: number;
  checkedAt: string;
};

const sections: { name: Section; description: string }[] = [
  { name: "Command", description: "What needs your attention today" },
  { name: "Acquisition", description: "Discovery, audits, and outreach" },
  { name: "Sales", description: "Conversations, pipeline, and orders" },
  { name: "Customers", description: "Workspaces and recovery outcomes" },
  { name: "Operations", description: "Connections, workers, and safety" },
];

const lanes = {
  Acquisition: [
    ["Discovery", "Find service businesses by niche and market."],
    ["Audit", "Collect website, SEO, and conversion evidence."],
    ["Outreach", "Prepare approval-gated contact from verified findings."],
  ],
  Sales: [
    ["Inbox", "Keep calls, email, SMS, and replies in one timeline."],
    ["Pipeline", "Track each opportunity from reply through sale."],
    ["Orders", "Connect checkout, onboarding, and workspace creation."],
  ],
  Customers: [
    ["Workspace", "Open the same product your customers use."],
    ["Connections", "See and test customer-owned provider connections."],
    ["Revenue", "Review only revenue supported by provider evidence."],
  ],
} as const;

async function requestReadiness() {
  const response = await fetch("/api/owner/readiness", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Readiness failed");
  }
  return payload.data as Readiness;
}

function StatusPill({ state }: { state: Check["state"] }) {
  return <span className={`owner-status-pill ${state}`}>{state}</span>;
}

function LaneView({ section }: { section: "Acquisition" | "Sales" | "Customers" }) {
  const hrefs =
    section === "Customers"
      ? ["/app", "/app/integrations", "/app/revenue"]
      : section === "Sales"
        ? ["/app/conversations", "/app", "/app/revenue"]
        : ["/app/website", "/app/website", "/app/automations"];
  return (
    <section className="owner-panel owner-lane">
      <header>
        <div>
          <span>{section}</span>
          <h2>{sections.find((item) => item.name === section)?.description}</h2>
        </div>
      </header>
      <div className="owner-lane-grid">
        {lanes[section].map(([title, detail], index) => (
          <article key={title}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <h3>{title}</h3>
            <p>{detail}</p>
            <Link href={hrefs[index]}>Open {title.toLowerCase()} →</Link>
          </article>
        ))}
      </div>
      <p className="owner-honesty">
        Empty states remain empty until a real worker or provider event supplies data.
      </p>
    </section>
  );
}

function OperationsView({
  readiness,
  loading,
  reload,
}: {
  readiness: Readiness | null;
  loading: boolean;
  reload: () => void;
}) {
  return (
    <>
      <section className="owner-panel">
        <header>
          <div>
            <span>LIVE READINESS</span>
            <h2>Connections and deployment health</h2>
            <p>
              This page reports safe status only. Secret values are never returned to
              the browser.
            </p>
          </div>
          <button type="button" onClick={reload} disabled={loading}>
            {loading ? "Checking…" : "Run check"}
          </button>
        </header>
        <div className="owner-check-grid">
          {(readiness?.checks || []).map((check) => (
            <article key={check.id}>
              <div>
                <h3>{check.name}</h3>
                <StatusPill state={check.state} />
              </div>
              <p>{check.detail}</p>
              <small>{check.source}</small>
            </article>
          ))}
          {!loading && !readiness && (
            <p className="owner-honesty">Readiness could not be loaded. Sign in again and retry.</p>
          )}
        </div>
      </section>
      <section className="owner-ops-actions">
        <article>
          <span>CUSTOMER CONNECTORS</span>
          <h3>Manage CRM, phone, calendar, payments, and field service</h3>
          <p>Customer credentials belong in the encrypted workspace vault.</p>
          <Link href="/app/integrations">Open connection center →</Link>
        </article>
        <article>
          <span>AUTOMATION</span>
          <h3>Inspect jobs, approvals, limits, and failed work</h3>
          <p>The native runtime is primary. Activepieces is optional.</p>
          <Link href="/app/automations">Open automation runtime →</Link>
        </article>
      </section>
    </>
  );
}

export default function OwnerOperations() {
  const [section, setSection] = useState<Section>("Command");
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReadiness = () => {
    setLoading(true);
    requestReadiness()
      .then(setReadiness)
      .catch(() => setReadiness(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    requestReadiness()
      .then((data) => {
        if (active) setReadiness(data);
      })
      .catch(() => {
        if (active) setReadiness(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const content = useMemo(() => {
    if (section === "Operations") {
      return <OperationsView readiness={readiness} loading={loading} reload={loadReadiness} />;
    }
    if (section === "Command") {
      const checks = readiness?.checks || [];
      return (
        <>
          <section className="owner-hero compact">
            <div>
              <span className="owner-eyebrow">PRIVATE OPERATOR CONTROL CENTER</span>
              <h1>See what is ready, what is blocked, and what to do next.</h1>
              <p>
                Recover handles acquisition, sales, and customer recovery. Live actions
                remain policy-gated and every status below comes from configuration or a
                health probe.
              </p>
            </div>
            <div className="owner-mode">
              <b>{readiness?.attention ? "NEEDS ATTENTION" : "SAFE MODE"}</b>
              <span>
                {loading
                  ? "Checking systems…"
                  : `${readiness?.ready || 0} ready · ${readiness?.attention || 0} need attention`}
              </span>
            </div>
          </section>
          <section className="owner-status-grid">
            {checks.map((check) => (
              <article key={check.id}>
                <div className="owner-card-title">
                  <span>{check.name}</span>
                  <StatusPill state={check.state} />
                </div>
                <strong>{check.state === "ready" ? "Ready" : check.state === "optional" ? "Optional" : "Check setup"}</strong>
                <p>{check.detail}</p>
              </article>
            ))}
          </section>
          <section className="owner-next">
            <div>
              <span>NEXT ACTION</span>
              <h2>{readiness?.attention ? "Finish the operational bridge first." : "Review customer connections."}</h2>
              <p>
                Platform configuration lives in Vercel and Railway. Customer-owned
                credentials live in the encrypted connection center.
              </p>
            </div>
            <button type="button" onClick={() => setSection("Operations")}>Open operations →</button>
          </section>
        </>
      );
    }
    return <LaneView section={section} />;
  }, [loading, readiness, section]);

  return (
    <main className="owner-shell">
      <aside className="owner-sidebar">
        <Link href="/" className="owner-brand">
          <span>R</span>
          <div><strong>Recover</strong><small>Operator OS</small></div>
        </Link>
        <nav aria-label="Owner navigation">
          <div>
            <span>OPERATE</span>
            {sections.map((item) => (
              <button
                type="button"
                key={item.name}
                className={section === item.name ? "active" : ""}
                onClick={() => setSection(item.name)}
                title={item.description}
              >
                {item.name}
              </button>
            ))}
          </div>
        </nav>
        <div className="owner-sidebar-foot">
          <span>Customer-facing product</span>
          <Link href="/app">Open customer workspace</Link>
        </div>
      </aside>
      <section className="owner-main">
        <header className="owner-topbar">
          <div><span>Recover internal operations</span><strong>{section}</strong></div>
          <div className="owner-top-actions">
            <button type="button" onClick={() => setSection("Operations")}>System status</button>
            <Link href="/">Public site</Link>
          </div>
        </header>
        <div className="owner-content">{content}</div>
      </section>
    </main>
  );
}
