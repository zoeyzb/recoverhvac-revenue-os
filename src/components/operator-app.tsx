"use client";
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Icon, IconName } from "@/components/icon";

export type View =
  | "Today"
  | "Inbox"
  | "Growth"
  | "Automations"
  | "Revenue"
  | "System";
type Provider = {
  id: string;
  name: string;
  category: string;
  description: string;
  configured: boolean;
  connection?: {
    status: string;
    mode: string;
    last_tested_at: string | null;
    last_success_at: string | null;
    last_webhook_at: string | null;
    last_error_code: string | null;
  } | null;
  fields: {
    key: string;
    label: string;
    secret: boolean;
    placeholder: string;
  }[];
};
type Session = {
  user: { id: string; email: string | null };
  role: "owner" | "admin" | "operator" | "viewer";
  organization: {
    id: string;
    name: string;
    timezone: string;
    communication_mode: string;
  };
};

const setupSession: Session = {
  user: { id: "setup", email: "Workspace preview" },
  role: "owner",
  organization: {
    id: "setup",
    name: "RecoverHVAC",
    timezone: "America/Chicago",
    communication_mode: "test",
  },
};

function LoginScreen({ setup = false }: { setup?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message || "Sign in failed");
      location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed");
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand login-brand">
          <div className="brand-orb">
            <Icon name="wind" size={21} />
          </div>
          <div>
            <strong>Recover</strong>
            <span>Revenue OS</span>
          </div>
        </div>
        <span className="kicker">SECURE OPERATOR ACCESS</span>
        <h1>{setup ? "Finish the data foundation" : "Welcome back."}</h1>
        <p>
          {setup
            ? "Configure Supabase URL, anon key, service-role key and the connector encryption key; run migrations 001–005; then create an Auth user and organization membership."
            : "Sign in with the account attached to your organization. Sessions stay in secure, HTTP-only cookies."}
        </p>
        {!setup && (
          <form onSubmit={login}>
            <label className="field">
              <span>Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                required
                minLength={8}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {message && <div className="result error">{message}</div>}
            <button className="button primary full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <Icon name="arrow" size={15} />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const navigation: { label: View; icon: IconName; href: string }[] = [
  { label: "Today", icon: "grid", href: "/owner" },
  { label: "Inbox", icon: "phone", href: "/owner/inbox" },
  { label: "Growth", icon: "users", href: "/owner/growth" },
  { label: "Automations", icon: "workflow", href: "/owner/automations" },
  { label: "Revenue", icon: "chart", href: "/owner/revenue" },
  { label: "System", icon: "plug", href: "/owner/system" },
];

function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={22} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action && (
        <button className="button primary" onClick={onAction}>
          {action}
          <Icon name="arrow" size={15} />
        </button>
      )}
    </div>
  );
}

function IntegrationModal({
  provider,
  close,
  refresh,
}: {
  provider: Provider;
  close: () => void;
  refresh: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "testing" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function runConnection(event: FormEvent, save = false) {
    event.preventDefault();
    setState("testing");
    setMessage("");
    try {
      const response = await fetch(
        `/api/integrations/${provider.id}/${save ? "connect" : "test"}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ credentials: values }),
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message ?? "Connection test failed");
      const result = save ? payload.data.test : payload.data;
      setState("success");
      setMessage(
        save
          ? result.verified
            ? "Connected, encrypted and verified."
            : "Saved securely. Provider verification is still required."
          : result.message,
      );
      refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Connection test failed",
      );
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-title"
      >
        <div className="modal-head">
          <div className="provider-mark">
            {provider.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="kicker">CONNECT PROVIDER</span>
            <h2 id="integration-title">{provider.name}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close">
            ×
          </button>
        </div>
        <p className="modal-copy">
          Test first or save the connection. Saved credentials are AES-GCM
          encrypted server-side and are never returned to the browser.
        </p>
        <form onSubmit={(event) => runConnection(event, false)}>
          {provider.fields.map((field) => (
            <label className="field" key={field.key}>
              <span>{field.label}</span>
              <input
                required
                type={field.secret ? "password" : "text"}
                autoComplete="off"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
              />
            </label>
          ))}
          {message && (
            <div className={`result ${state}`}>
              <Icon name={state === "success" ? "check" : "shield"} size={16} />
              {message}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={close}>
              Cancel
            </button>
            <button className="button ghost" disabled={state === "testing"}>
              Test only
            </button>
            <button
              type="button"
              className="button primary"
              disabled={state === "testing"}
              onClick={(event) =>
                runConnection(event as unknown as FormEvent, true)
              }
            >
              {state === "testing" ? "Working securely…" : "Save & connect"}
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </form>
        <small className="security-note">
          <Icon name="shield" size={14} /> A server encryption key is required
          before credentials can be saved. OAuth providers remain pending until
          their account-specific authorization completes.
        </small>
      </section>
    </div>
  );
}

function ActionConsole() {
  const [channel, setChannel] = useState<
    "operator" | "call" | "email" | "analysis"
  >("operator");
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult("");
    try {
      const response = await fetch(`/api/actions/${channel}/test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipient, content }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message ?? "Action failed");
      setResult(payload.data.output ?? payload.data.message);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="action-console">
      <div className="channel-tabs">
        {(["operator", "call", "email", "analysis"] as const).map((item) => (
          <button
            key={item}
            className={channel === item ? "active" : ""}
            onClick={() => {
              setChannel(item);
              setResult("");
            }}
          >
            <Icon
              name={
                item === "call" ? "phone" : item === "email" ? "send" : "wave"
              }
              size={16}
            />
            {item === "operator"
              ? "AI operator"
              : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <form onSubmit={run} className="action-form">
        <span className="kicker">POLICY-GATED OPERATIONS</span>
        <h2>
          {channel === "operator"
            ? "Decide the next best action"
            : channel === "analysis"
              ? "Analyze a real conversation"
              : `Send a verified test ${channel}`}
        </h2>
        <p>
          {channel === "operator"
            ? "Give the AI the real customer or prospect context. It will recommend call, SMS, email, wait, human review or do-not-contact—but it cannot execute without policy and approval."
            : channel === "analysis"
              ? "Paste a transcript or customer message. OpenAI will return a concise revenue-operations analysis."
              : "Only recipients in the server-side TEST_RECIPIENTS allowlist can be contacted."}
        </p>
        {(channel === "call" || channel === "email") && (
          <label className="field">
            <span>
              {channel === "call" ? "Phone number" : "Email recipient"}
            </span>
            <input
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={
                channel === "call" ? "+13125550123" : "owner@example.com"
              }
            />
          </label>
        )}
        <label className="field">
          <span>
            {channel === "operator"
              ? "Customer, conversation and objective"
              : channel === "analysis"
                ? "Transcript or message"
                : channel === "call"
                  ? "Spoken test message"
                  : "Email body"}
          </span>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter verified context only…"
          />
        </label>
        <button className="button primary" disabled={busy}>
          {busy
            ? "Running securely…"
            : channel === "operator"
              ? "Prepare action plan"
              : channel === "analysis"
                ? "Run analysis"
                : `Send test ${channel}`}
          <Icon name="arrow" size={15} />
        </button>
        {result && <pre className="action-result">{result}</pre>}
      </form>
    </section>
  );
}

type RecoveryOrder = {
  id: string;
  company_name: string;
  domain: string;
  status: string;
  current_step: string;
  findings: { key: string; label: string; passed: boolean }[];
  action_plan?: { output?: string; message?: string } | null;
  created_at: string;
};
type Approval = {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  requested_by: string;
  expires_at: string | null;
  created_at: string;
};
type ProviderFailure = {
  id: string;
  provider: string;
  event_type: string;
  attempt_count: number;
  processing_error: string | null;
  dead_lettered_at: string | null;
};
type Appointment = {
  id: string;
  provider: string;
  status: string;
  starts_at: string;
  ends_at: string;
};
type Payment = {
  id: string;
  provider: string;
  amount_minor: number;
  currency: string;
  verified_at: string;
};
type Operations = {
  approvals: Approval[];
  failures: ProviderFailure[];
  appointments: Appointment[];
  payments: Payment[];
};

function OperationsCenter() {
  const [operations, setOperations] = useState<Operations>({
    approvals: [],
    failures: [],
    appointments: [],
    payments: [],
  });
  const [persistence, setPersistence] = useState<
    "loading" | "supabase" | "unavailable"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/operations")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error?.message ?? "Operations unavailable");
        if (active) {
          setOperations(payload.data);
          setPersistence(payload.persistence);
        }
      })
      .catch((error) => {
        if (active) {
          setPersistence("unavailable");
          setMessage(
            error instanceof Error ? error.message : "Operations unavailable",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function decide(id: string, decision: "approved" | "rejected") {
    setMessage("");
    try {
      const response = await fetch(`/api/approvals/${id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message ?? "Decision failed");
      setOperations((current) => ({
        ...current,
        approvals: current.approvals.filter((item) => item.id !== id),
      }));
      setMessage(`Action ${decision}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision failed");
    }
  }

  const attention = operations.approvals.length + operations.failures.length;
  return (
    <section className="operations-center">
      <div className="section-bar">
        <div>
          <span className="kicker">OPERATOR CONTROL</span>
          <h2>What needs attention</h2>
          <p>
            Approvals, failed automation, upcoming bookings and verified
            payments. No synthetic activity.
          </p>
        </div>
        <span className={attention ? "count-chip attention" : "count-chip"}>
          {persistence === "loading"
            ? "Loading"
            : persistence === "unavailable"
              ? "Data not connected"
              : `${attention} need attention`}
        </span>
      </div>
      {message && <div className="ops-message">{message}</div>}
      <div className="ops-grid">
        <article>
          <div className="ops-title">
            <Icon name="shield" size={17} />
            <div>
              <strong>Approvals</strong>
              <small>{operations.approvals.length} pending</small>
            </div>
          </div>
          {operations.approvals.length === 0 ? (
            <p className="ops-empty">No pending approvals.</p>
          ) : (
            operations.approvals.map((item) => (
              <div className="ops-row" key={item.id}>
                <div>
                  <strong>{item.action.replaceAll("_", " ")}</strong>
                  <small>Requested by {item.requested_by}</small>
                </div>
                <span>
                  <button onClick={() => decide(item.id, "rejected")}>
                    Reject
                  </button>
                  <button
                    className="approve"
                    onClick={() => decide(item.id, "approved")}
                  >
                    Approve
                  </button>
                </span>
              </div>
            ))
          )}
        </article>
        <article>
          <div className="ops-title">
            <Icon name="workflow" size={17} />
            <div>
              <strong>Automation failures</strong>
              <small>{operations.failures.length} unresolved</small>
            </div>
          </div>
          {operations.failures.length === 0 ? (
            <p className="ops-empty">No unresolved failures.</p>
          ) : (
            operations.failures.map((item) => (
              <div className="ops-row" key={item.id}>
                <div>
                  <strong>
                    {item.provider} · {item.event_type}
                  </strong>
                  <small>
                    {item.dead_lettered_at
                      ? "Dead-lettered"
                      : `Retry ${item.attempt_count}/8`}{" "}
                    {item.processing_error ? `— ${item.processing_error}` : ""}
                  </small>
                </div>
              </div>
            ))
          )}
        </article>
        <article>
          <div className="ops-title">
            <Icon name="calendar" size={17} />
            <div>
              <strong>Upcoming bookings</strong>
              <small>{operations.appointments.length} confirmed or held</small>
            </div>
          </div>
          {operations.appointments.length === 0 ? (
            <p className="ops-empty">No verified bookings.</p>
          ) : (
            operations.appointments.map((item) => (
              <div className="ops-row" key={item.id}>
                <div>
                  <strong>{new Date(item.starts_at).toLocaleString()}</strong>
                  <small>
                    {item.provider} · {item.status}
                  </small>
                </div>
              </div>
            ))
          )}
        </article>
        <article>
          <div className="ops-title">
            <Icon name="chart" size={17} />
            <div>
              <strong>Verified payments</strong>
              <small>{operations.payments.length} recent</small>
            </div>
          </div>
          {operations.payments.length === 0 ? (
            <p className="ops-empty">No verified payments.</p>
          ) : (
            operations.payments.map((item) => (
              <div className="ops-row" key={item.id}>
                <div>
                  <strong>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: item.currency,
                    }).format(item.amount_minor / 100)}
                  </strong>
                  <small>
                    {item.provider} ·{" "}
                    {new Date(item.verified_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))
          )}
        </article>
      </div>
    </section>
  );
}

function GrowthWorkspace({ openSystem }: { openSystem: () => void }) {
  const [orders, setOrders] = useState<RecoveryOrder[]>([]);
  const [persistence, setPersistence] = useState<
    "loading" | "supabase" | "unavailable"
  >("loading");
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<RecoveryOrder | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/orders")
      .then((response) => response.json())
      .then((payload) => {
        setOrders(payload.data ?? []);
        setPersistence(payload.persistence ?? "unavailable");
      })
      .catch(() => setPersistence("unavailable"));
  }, []);

  async function runAudit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/growth/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName,
          domain,
          contactEmail,
          contactPhone,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message ?? "Audit failed");
      setOrders((current) => [
        payload.data,
        ...current.filter((order) => order.id !== payload.data.id),
      ]);
      setMessage(
        "Work order saved and full Lighthouse audit queued. Outreach begins only after verified evidence and policy approval.",
      );
      setCompanyName("");
      setDomain("");
      setContactEmail("");
      setContactPhone("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Audit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="growth-workspace">
      <section className="growth-launch">
        <div>
          <span className="kicker">NEW AUTOPILOT ORDER</span>
          <h2>Give Recover a company.</h2>
          <p>
            It will inspect the real public website, record verified gaps,
            prepare the next action and create one work order. Outreach stays
            approval-gated until consent and contactability are known.
          </p>
        </div>
        <form onSubmit={runAudit}>
          <label className="field">
            <span>Company name</span>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Heating & Cooling"
            />
          </label>
          <label className="field">
            <span>Public website</span>
            <input
              required
              type="url"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://example.com"
            />
          </label>
          <label className="field">
            <span>Contact email (optional)</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </label>
          <label className="field">
            <span>Contact phone (optional)</span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+13125550123"
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy ? "Creating & queueing audit…" : "Start full recovery order"}
            <Icon name="arrow" size={15} />
          </button>
          {message && <p className="launch-message">{message}</p>}
        </form>
      </section>
      <section className="orders-panel">
        <div className="section-bar">
          <div>
            <h2>Company orders</h2>
            <p>
              One place to see what Recover found and what must happen next.
            </p>
          </div>
          <span
            className={
              persistence === "supabase" ? "count-chip connected" : "count-chip"
            }
          >
            {persistence === "supabase"
              ? "Saved to Supabase"
              : "Data not connected"}
          </span>
        </div>
        {orders.length === 0 ? (
          <EmptyState
            icon="scan"
            title="No company orders yet"
            body="Add a real HVAC company above. No sample companies or fabricated audits are inserted."
          />
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article key={order.id}>
                <div className="order-company">
                  <div className="provider-mark">
                    {order.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{order.company_name}</strong>
                    <a href={order.domain} target="_blank" rel="noreferrer">
                      {new URL(order.domain).hostname}
                    </a>
                  </div>
                </div>
                <span className="order-state">{order.status}</span>
                <div className="order-step">
                  <small>NEXT REQUIRED ACTION</small>
                  <strong>{order.current_step}</strong>
                </div>
                <div className="order-findings">
                  <small>VERIFIED CHECKS</small>
                  <strong>
                    {order.findings.filter((item) => item.passed).length}/
                    {order.findings.length} passed
                  </strong>
                </div>
                <button
                  className="button ghost"
                  onClick={() => setSelectedOrder(order)}
                >
                  View order
                </button>
              </article>
            ))}
          </div>
        )}
        {persistence === "unavailable" && (
          <div className="persistence-warning">
            <Icon name="shield" size={17} />
            <div>
              <strong>Orders are not durable yet</strong>
              <p>
                Add the Supabase service key and run the included migration to
                preserve orders, timelines and provider references.
              </p>
            </div>
            <button className="button ghost" onClick={openSystem}>
              Open System
            </button>
          </div>
        )}
      </section>
      {selectedOrder && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSelectedOrder(null)
          }
        >
          <section
            className="modal order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-title"
          >
            <div className="modal-head">
              <div className="provider-mark">
                {selectedOrder.company_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="kicker">COMPANY WORK ORDER</span>
                <h2 id="order-title">{selectedOrder.company_name}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="order-detail">
              <small>NEXT REQUIRED ACTION</small>
              <strong>{selectedOrder.current_step}</strong>
            </div>
            <div className="detail-checks">
              {selectedOrder.findings.map((item) => (
                <div key={item.key} className={item.passed ? "passed" : "gap"}>
                  <Icon name={item.passed ? "check" : "shield"} size={14} />
                  <span>{item.label}</span>
                  <b>{item.passed ? "Verified" : "Gap"}</b>
                </div>
              ))}
            </div>
            <div className="order-plan">
              <small>AI RECOMMENDATION</small>
              <pre>
                {selectedOrder.action_plan?.output ??
                  selectedOrder.action_plan?.message ??
                  "No AI recommendation is available. Connect the intelligence provider, then rerun planning."}
              </pre>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

type Workflow = {
  id: string;
  name: string;
  trigger_type: string;
  enabled: boolean;
  definition: { steps: { type: string }[] };
};
type AuditJob = {
  id: string;
  requested_url: string;
  status: string;
  created_at: string;
};
function AutomationSetup() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [audits, setAudits] = useState<AuditJob[]>([]);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const load = () =>
    Promise.all([
      fetch("/api/workflows")
        .then((r) => r.json())
        .then((p) => setWorkflows(p.data || [])),
      fetch("/api/audits")
        .then((r) => r.json())
        .then((p) => setAudits(p.data || [])),
    ]);
  useEffect(() => {
    void load();
  }, []);
  async function seed() {
    const response = await fetch("/api/workflows/seed", { method: "POST" });
    if (response.ok) {
      await load();
      setMessage(
        "Recovery templates installed disabled. Review each before activation.",
      );
    }
  }
  async function queue(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/audits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json();
    setMessage(
      response.ok ? "Full Lighthouse audit queued." : payload.error?.message,
    );
    if (response.ok) {
      setUrl("");
      await load();
    }
  }
  return (
    <section className="automation-setup">
      <div className="section-bar">
        <div>
          <h2>Automation & evidence</h2>
          <p>
            Versioned recovery workflows and real browser audits. Everything
            starts disabled or queued.
          </p>
        </div>
        {!workflows.length && (
          <button className="button ghost" onClick={seed}>
            Install recovery templates
          </button>
        )}
      </div>
      {message && <div className="ops-message">{message}</div>}
      <div className="ops-grid">
        <article>
          <div className="ops-title">
            <Icon name="workflow" size={17} />
            <div>
              <strong>Recovery workflows</strong>
              <small>Missed calls · estimates · reviews</small>
            </div>
          </div>
          {workflows.length ? (
            workflows.map((item) => (
              <div className="ops-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.trigger_type} · {item.definition.steps.length} steps
                  </small>
                </div>
                <button
                  onClick={async () => {
                    await fetch(`/api/workflows/${item.id}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ enabled: !item.enabled }),
                    });
                    await load();
                  }}
                >
                  {item.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            ))
          ) : (
            <p className="ops-empty">Install reviewed templates to begin.</p>
          )}
        </article>
        <article>
          <div className="ops-title">
            <Icon name="scan" size={17} />
            <div>
              <strong>Browser audit queue</strong>
              <small>Lighthouse with stored evidence</small>
            </div>
          </div>
          <form onSubmit={queue}>
            <label className="field">
              <span>Public HTTPS website</span>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com"
              />
            </label>
            <button className="button primary">Queue full audit</button>
          </form>
          {audits.slice(0, 4).map((item) => (
            <div className="ops-row" key={item.id}>
              <div>
                <strong>{new URL(item.requested_url).hostname}</strong>
                <small>
                  {item.status} ·{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

const onboardingSteps = [
  ["business_profile", "Confirm business profile"],
  ["data_foundation", "Connect identity and database"],
  ["communications", "Verify phone and email"],
  ["policies", "Review consent and calling policy"],
  ["recovery_workflows", "Install recovery workflows"],
  ["golden_path", "Complete a test recovery"],
] as const;
function OnboardingPanel() {
  const [complete, setComplete] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((p) =>
        setComplete(
          new Set(
            (p.data || [])
              .filter((x: { status: string }) => x.status === "complete")
              .map((x: { step_key: string }) => x.step_key),
          ),
        ),
      );
  }, []);
  return (
    <section className="glass-panel">
      <span className="kicker">CUSTOMER ONBOARDING</span>
      <h2>
        {complete.size}/{onboardingSteps.length} launch checks complete
      </h2>
      <div className="stack-list">
        {onboardingSteps.map(([key, label]) => (
          <button
            key={key}
            onClick={async () => {
              const next = !complete.has(key);
              await fetch(`/api/onboarding/${key}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  status: next ? "complete" : "pending",
                  evidence: { confirmed_in_app: true },
                }),
              });
              setComplete((current) => {
                const copy = new Set(current);
                next ? copy.add(key) : copy.delete(key);
                return copy;
              });
            }}
          >
            <span
              className={
                complete.has(key) ? "stack-status done" : "stack-status"
              }
            >
              {complete.has(key) ? (
                <Icon name="check" size={13} />
              ) : (
                complete.size + 1
              )}
            </span>
            <div>
              <strong>{label}</strong>
              <small>
                {complete.has(key)
                  ? "Evidence recorded"
                  : "Required before live mode"}
              </small>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ConversationTimeline() {
  const [items, setItems] = useState<
    {
      id: string;
      direction: string;
      channel: string;
      body: string;
      status: string;
      created_at: string;
    }[]
  >([]);
  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((p) => setItems(p.data || []));
  }, []);
  return (
    <section className="glass-panel">
      <div className="section-bar">
        <div>
          <h2>Unified conversation timeline</h2>
          <p>Calls, SMS and email ordered from durable provider records.</p>
        </div>
        <span className="count-chip">{items.length} events</span>
      </div>
      {items.length ? (
        items.map((item) => (
          <div className="ops-row" key={item.id}>
            <div>
              <strong>
                {item.direction} {item.channel}
              </strong>
              <small>
                {item.body || "Provider event"} ·{" "}
                {new Date(item.created_at).toLocaleString()}
              </small>
            </div>
            <span>{item.status}</span>
          </div>
        ))
      ) : (
        <p className="ops-empty">No verified conversations yet.</p>
      )}
    </section>
  );
}
function LedgerPanel() {
  const [ledger, setLedger] = useState<{
    entries: {
      id: string;
      entry_type: string;
      category: string;
      amount_minor: number;
      currency: string;
      occurred_at: string;
    }[];
    totals: { net_minor: number };
  } | null>(null);
  useEffect(() => {
    fetch("/api/ledger")
      .then((r) => r.json())
      .then((p) => setLedger(p.data || null));
  }, []);
  return (
    <section className="glass-panel">
      <div className="section-bar">
        <div>
          <h2>Revenue & cost ledger</h2>
          <p>
            Only provider-backed entries count toward net recovered revenue.
          </p>
        </div>
        <span className="count-chip">
          {ledger
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(ledger.totals.net_minor / 100)
            : "—"}{" "}
          net
        </span>
      </div>
      {ledger?.entries.length ? (
        ledger.entries.slice(0, 8).map((item) => (
          <div className="ops-row" key={item.id}>
            <div>
              <strong>{item.category}</strong>
              <small>
                {item.entry_type} ·{" "}
                {new Date(item.occurred_at).toLocaleDateString()}
              </small>
            </div>
            <span>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: item.currency,
              }).format(item.amount_minor / 100)}
            </span>
          </div>
        ))
      ) : (
        <p className="ops-empty">No verified revenue or cost entries yet.</p>
      )}
    </section>
  );
}

type RuntimeData = {
  settings: {
    master_enabled: boolean;
    approval_mode: string;
    daily_call_limit: number;
    daily_sms_limit: number;
    daily_email_limit: number;
  };
  counts: Record<string, number>;
  jobs: {
    id: string;
    state: string;
    workflow_key: string;
    attempt_count: number;
    last_error: string | null;
    updated_at: string;
  }[];
  connections: { provider: string; status: string }[];
  events: {
    id: string;
    provider: string;
    event_type: string;
    processed_at: string | null;
    processing_error: string | null;
    received_at: string;
  }[];
};
function RuntimePanel({ expanded = false }: { expanded?: boolean }) {
  const [data, setData] = useState<RuntimeData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/runtime")
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error?.message || "Runtime unavailable");
        setData(p.data);
      })
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function save(settings: Partial<RuntimeData["settings"]>) {
    if (!data) return;
    setBusy(true);
    const response = await fetch("/api/runtime/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data.settings, ...settings }),
    });
    const payload = await response.json();
    if (response.ok) {
      setData({ ...data, settings: payload.data });
      setMessage(
        payload.data.master_enabled
          ? "Autopilot armed. Policy gates remain active."
          : "Autopilot paused.",
      );
    } else setMessage(payload.error?.message || "Update failed");
    setBusy(false);
  }
  async function run() {
    setBusy(true);
    const response = await fetch("/api/runtime/run", { method: "POST" });
    const payload = await response.json();
    setMessage(
      response.ok
        ? `Processed ${payload.data.events.length} events and ${payload.data.jobs.length} jobs.`
        : payload.error?.message || "Run failed",
    );
    await load();
    setBusy(false);
  }
  const active =
    (data?.counts.running || 0) +
    (data?.counts.queued || 0) +
    (data?.counts.waiting || 0);
  return (
    <section className="runtime-panel">
      <div className="runtime-head">
        <div>
          <span className="eyebrow">
            <i
              className={
                data?.settings.master_enabled ? "live-dot" : "idle-dot"
              }
            />
            {data?.settings.master_enabled
              ? "AUTOPILOT ARMED"
              : "AUTOPILOT PAUSED"}
          </span>
          <h2>Hands-off recovery engine</h2>
          <p>
            Events enter once. Recover verifies policy, follows up, books,
            reconciles and records evidence.
          </p>
        </div>
        <div className="runtime-actions">
          <button className="button ghost" disabled={busy} onClick={run}>
            Run now
          </button>
          <button
            aria-label="Toggle autopilot"
            className={data?.settings.master_enabled ? "toggle on" : "toggle"}
            disabled={busy || !data}
            onClick={() =>
              save({ master_enabled: !data?.settings.master_enabled })
            }
          >
            <span />
          </button>
        </div>
      </div>
      {message && <div className="runtime-message">{message}</div>}
      <div className="runtime-metrics">
        <article>
          <strong>{active}</strong>
          <span>Active jobs</span>
        </article>
        <article>
          <strong>{data?.counts.approval || 0}</strong>
          <span>Need approval</span>
        </article>
        <article>
          <strong>{data?.counts.dead_letter || 0}</strong>
          <span>Dead-lettered</span>
        </article>
        <article>
          <strong>
            {data?.connections.filter((x) => x.status === "connected").length ||
              0}
          </strong>
          <span>Verified systems</span>
        </article>
      </div>
      {expanded && (
        <>
          <div className="runtime-settings">
            <label>
              <span>Approval policy</span>
              <select
                value={data?.settings.approval_mode || "first_touch"}
                onChange={(e) => save({ approval_mode: e.target.value })}
              >
                <option value="every_action">Approve every action</option>
                <option value="first_touch">Approve first touch</option>
                <option value="policy_only">Policy only</option>
              </select>
            </label>
            <label>
              <span>Calls / day</span>
              <input
                type="number"
                value={data?.settings.daily_call_limit || 0}
                onChange={(e) =>
                  setData(
                    data
                      ? {
                          ...data,
                          settings: {
                            ...data.settings,
                            daily_call_limit: Number(e.target.value),
                          },
                        }
                      : data,
                  )
                }
              />
            </label>
            <label>
              <span>SMS / day</span>
              <input
                type="number"
                value={data?.settings.daily_sms_limit || 0}
                onChange={(e) =>
                  setData(
                    data
                      ? {
                          ...data,
                          settings: {
                            ...data.settings,
                            daily_sms_limit: Number(e.target.value),
                          },
                        }
                      : data,
                  )
                }
              />
            </label>
            <button
              className="button ghost"
              onClick={() => data && save(data.settings)}
            >
              Save limits
            </button>
          </div>
          <div className="job-list">
            {data?.jobs.length ? (
              data.jobs.slice(0, 12).map((job) => (
                <div className="job-row" key={job.id}>
                  <span className={`job-state ${job.state}`} />
                  <div>
                    <strong>{job.workflow_key.replaceAll("_", " ")}</strong>
                    <small>
                      {job.last_error || `Attempt ${job.attempt_count}`} ·{" "}
                      {new Date(job.updated_at).toLocaleString()}
                    </small>
                  </div>
                  <b>{job.state}</b>
                </div>
              ))
            ) : (
              <EmptyState
                icon="workflow"
                title="No automation jobs"
                body="Signed provider events create jobs automatically. Nothing synthetic is inserted."
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function VerifiedActivityStream() {
  const [events, setEvents] = useState<RuntimeData["events"]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/runtime")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error?.message || "Activity unavailable");
        setEvents(payload.data?.events || []);
      })
      .catch((reason) => setError(reason.message));
  }, []);
  return (
    <article className="glass-panel stream">
      <div className="panel-title">
        <div>
          <span className="kicker">LIVE OPERATIONS</span>
          <h2>Activity stream</h2>
        </div>
        <span className="live-chip">
          <i />
          Listening
        </span>
      </div>
      {events.length ? (
        <div className="job-list">
          {events.slice(0, 8).map((event) => (
            <div className="job-row" key={event.id}>
              <span
                className={`job-state ${event.processing_error ? "dead_letter" : event.processed_at ? "completed" : "queued"}`}
              />
              <div>
                <strong>{event.event_type.replaceAll(".", " ")}</strong>
                <small>
                  {event.provider} ·{" "}
                  {new Date(event.received_at).toLocaleString()}
                </small>
              </div>
              <b>
                {event.processing_error
                  ? "failed"
                  : event.processed_at
                    ? "processed"
                    : "queued"}
              </b>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="wave"
          title={error || "Nothing has happened yet"}
          body="Real events appear after a provider sends its first verified webhook. No demo activity is shown."
        />
      )}
    </article>
  );
}

function IntegrationCatalog({
  providers,
  loading,
  onSelect,
}: {
  providers: Provider[];
  loading: boolean;
  onSelect: (provider: Provider) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...Array.from(new Set(providers.map((provider) => provider.category))),
  ];
  const filtered = providers.filter(
    (provider) =>
      (category === "All" || provider.category === category) &&
      `${provider.name} ${provider.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="connector-catalog">
      <div className="catalog-head">
        <div>
          <span className="kicker">CONNECTION LAYER</span>
          <h2>Connect the stack you already use.</h2>
          <p>
            Credentials stay encrypted in the server vault. Each card shows
            verification and webhook health from real backend records.
          </p>
        </div>
        <div className="catalog-score">
          <strong>
            {providers.filter((provider) => provider.configured).length}/
            {providers.length}
          </strong>
          <span>systems ready</span>
        </div>
      </div>
      <div className="catalog-tools">
        <label className="search-box">
          <Icon name="scan" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search CRM, phone, scheduling, payments…"
          />
        </label>
        <div className="category-tabs">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="integration-grid">
        {loading ? (
          <div className="loader">Reading connection health…</div>
        ) : (
          filtered.map((provider) => {
            const status =
              provider.connection?.status ||
              (provider.configured ? "connected" : "needs_credentials");
            return (
              <article className="integration-card" key={provider.id}>
                <div className="card-top">
                  <div className="provider-mark">
                    {provider.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`connection ${status}`}>
                    <i />
                    {status.replaceAll("_", " ")}
                  </span>
                </div>
                <span className="category">{provider.category}</span>
                <h3>{provider.name}</h3>
                <p>{provider.description}</p>
                <div className="connector-meta">
                  <span>Last test</span>
                  <strong>
                    {provider.connection?.last_tested_at
                      ? new Date(
                          provider.connection.last_tested_at,
                        ).toLocaleString()
                      : "Not tested"}
                  </strong>
                </div>
                <button
                  className={
                    provider.configured
                      ? "button ghost full"
                      : "button primary full"
                  }
                  onClick={() => onSelect(provider)}
                >
                  {provider.configured ? "Manage & test" : "Connect securely"}
                  <Icon name="arrow" size={15} />
                </button>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function Home({
  initialView = "Today",
}: {
  initialView?: View;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<
    "loading" | "signed-in" | "signed-out" | "setup"
  >("loading");
  const [view, setView] = useState<View>(initialView);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations");
      const payload = await response.json();
      setProviders(payload.data ?? []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then(async (response) => {
        const payload = await response.json();
        if (!active) return;
        if (response.ok) {
          setSession(payload.data);
          setAuthState("signed-in");
        } else setAuthState(response.status === 503 ? "setup" : "signed-out");
      })
      .catch(() => active && setAuthState("signed-out"));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (authState !== "signed-in" && authState !== "setup") return;
    let active = true;
    fetch(authState === "setup" ? "/api/catalog" : "/api/integrations")
      .then((response) => response.json())
      .then((payload) => {
        if (active) setProviders(payload.data ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authState]);
  const connected = useMemo(
    () => providers.filter((p) => p.configured).length,
    [providers],
  );
  const ready = connected >= 3;

  if (authState === "loading")
    return (
      <main className="login-shell">
        <div className="loader">Verifying secure session…</div>
      </main>
    );
  if (authState === "signed-out") return <LoginScreen />;
  const activeSession = session || setupSession;
  const setupMode = authState === "setup";
  const initials = (activeSession.user.email || "operator")
    .split(/[@._-]/)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("");
  return (
    <div className="app-shell">
      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-orb">
            <Icon name="wind" size={21} />
          </div>
          <div>
            <strong>Recover</strong>
            <span>Revenue OS</span>
          </div>
        </div>
        <nav aria-label="Workspace navigation">
          {navigation.map((item) => (
            <a
              href={item.href}
              key={item.label}
              className={view === item.label ? "nav-item active" : "nav-item"}
              onClick={() => {
                setView(item.label);
                setMobileNav(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "System" && (
                <b>
                  {connected}/{providers.length || 11}
                </b>
              )}
            </a>
          ))}
        </nav>
        <div className="safe-mode">
          <div className="safe-row">
            <span className="pulse" />
            <strong>Safe mode</strong>
          </div>
          <p>
            Outbound actions are locked until providers and test recipients are
            verified.
          </p>
        </div>
        <div className="owner">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{activeSession.user.email}</strong>
            <span>
              {setupMode
                ? "Safe preview · backend pending"
                : `${activeSession.role} · ${activeSession.organization.name}`}
            </span>
          </div>
          {!setupMode && (
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                location.reload();
              }}
            >
              <Icon name="more" size={17} />
            </button>
          )}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="menu"
            onClick={() => setMobileNav((v) => !v)}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
          <div className="crumb">
            <span>RecoverHVAC</span>
            <b>/</b>
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <div className="environment">
              <span />
              Test environment
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Icon name="bell" size={18} />
            </button>
            <a className="button primary" href="/system/">
              <Icon name="plug" size={16} />
              Connect system
            </a>
          </div>
        </header>
        <div className="content">
          {setupMode && (
            <section className="setup-banner" role="status">
              <div>
                <span className="setup-pulse" />
                <strong>Product preview is live</strong>
                <p>
                  Explore the complete workspace now. Connect Supabase to unlock
                  sign-in, saved records and live automation.
                </p>
              </div>
              <a className="button primary" href="/system/">
                Open setup center
                <Icon name="arrow" size={14} />
              </a>
            </section>
          )}
          <section className="hero">
            <div>
              <span className="kicker">
                REVENUE OPERATIONS, WITHOUT THE NOISE
              </span>
              <h1>
                {view === "Today" ? (
                  <>
                    Turn missed demand into
                    <br />
                    <em>booked revenue.</em>
                  </>
                ) : (
                  view
                )}
              </h1>
              <p>
                {view === "Today"
                  ? "One operating layer for acquisition, conversations, follow-up and attributable revenue—powered only by verified data."
                  : view === "Inbox"
                    ? "Calls, messages, AI analysis, consent and outcomes in one timeline."
                    : view === "Growth"
                      ? "Discover, audit, approve and convert HVAC prospects without contaminating customer operations."
                      : view === "Automations"
                        ? "Watch every recovery job move from signed event to policy decision, approved action and verified outcome."
                        : view === "Revenue"
                          ? "Trace every recovered dollar and operating cost to its provider evidence and customer journey."
                          : "Connect and verify every service from one encrypted, health-aware control surface."}
              </p>
            </div>
            {view === "Today" && (
              <div className="readiness">
                <div
                  className="readiness-ring"
                  style={
                    {
                      "--progress": `${providers.length ? Math.round((connected / providers.length) * 100) : 0}%`,
                    } as React.CSSProperties
                  }
                >
                  <span>{connected}</span>
                  <small>connected</small>
                </div>
                <div>
                  <strong>
                    {ready
                      ? "Ready to configure workflows"
                      : "Finish your data foundation"}
                  </strong>
                  <p>
                    {connected
                      ? `${providers.length - connected} provider${providers.length - connected === 1 ? "" : "s"} still need credentials.`
                      : "Connect data, communications and intelligence first."}
                  </p>
                </div>
              </div>
            )}
          </section>

          {view === "Today" && (
            <>
              <section className="stat-grid">
                <article>
                  <span>Recovered revenue</span>
                  <strong>—</strong>
                  <small>No verified transactions yet</small>
                </article>
                <article>
                  <span>Open opportunities</span>
                  <strong>—</strong>
                  <small>Connect your CRM</small>
                </article>
                <article>
                  <span>Conversations</span>
                  <strong>—</strong>
                  <small>Connect email or voice</small>
                </article>
              </section>
              <RuntimePanel />
              <OperationsCenter />
              <LedgerPanel />
              <section className="overview-grid">
                <article className="glass-panel next-step">
                  <span className="kicker">RECOMMENDED NEXT STEP</span>
                  <div className="step-icon">
                    <Icon name="plug" size={23} />
                  </div>
                  <h2>Build your data foundation</h2>
                  <p>
                    Start with the minimum stack. You can add the rest when the
                    first workflow is proven.
                  </p>
                  <div className="stack-list">
                    {["Supabase", "OpenAI", "Twilio"].map((name) => {
                      const p = providers.find((x) => x.name === name);
                      return (
                        <button key={name} onClick={() => p && setSelected(p)}>
                          <span
                            className={
                              p?.configured
                                ? "stack-status done"
                                : "stack-status"
                            }
                          >
                            {p?.configured ? (
                              <Icon name="check" size={13} />
                            ) : (
                              providers.findIndex((x) => x.name === name) + 1
                            )}
                          </span>
                          <div>
                            <strong>{name}</strong>
                            <small>
                              {p?.configured
                                ? "Connected and available"
                                : "Required for the first live workflow"}
                            </small>
                          </div>
                          <Icon name="arrow" size={16} />
                        </button>
                      );
                    })}
                  </div>
                </article>
                <VerifiedActivityStream />
              </section>
              <section className="principle">
                <Icon name="shield" size={20} />
                <div>
                  <strong>Truth-first reporting</strong>
                  <p>
                    Every number in Recover must trace back to a provider event,
                    customer record, or payment. Unknown is shown as “—”, never
                    estimated.
                  </p>
                </div>
                <a className="button ghost" href="/system/">
                  Review system
                </a>
              </section>
            </>
          )}
          {view === "System" && (
            <>
              <OnboardingPanel />
              <section className="system-strip">
                <div>
                  <Icon name="workflow" size={18} />
                  <span>
                    <strong>Native automation runtime</strong>
                    <small>
                      Atomic job leases, retries, approvals and dead letters are
                      built in.
                    </small>
                  </span>
                </div>
                <div>
                  <Icon name="shield" size={18} />
                  <span>
                    <strong>Encrypted connector vault</strong>
                    <small>
                      Provider secrets are encrypted and never returned to this
                      browser.
                    </small>
                  </span>
                </div>
                <div>
                  <Icon name="chart" size={18} />
                  <span>
                    <strong>Evidence-backed truth</strong>
                    <small>
                      Delivery, bookings and revenue require signed provider
                      evidence.
                    </small>
                  </span>
                </div>
              </section>
              <IntegrationCatalog
                providers={providers}
                loading={loading}
                onSelect={setSelected}
              />
            </>
          )}

          {view === "Growth" && (
            <GrowthWorkspace openSystem={() => setView("System")} />
          )}
          {view === "Inbox" && (
            <>
              <ConversationTimeline />
              <ActionConsole />
            </>
          )}
          {view === "Automations" && (
            <>
              <RuntimePanel expanded />
              <AutomationSetup />
            </>
          )}
          {view === "Revenue" && <LedgerPanel />}
        </div>
      </main>
      {selected && (
        <IntegrationModal
          provider={selected}
          close={() => setSelected(null)}
          refresh={loadProviders}
        />
      )}
    </div>
  );
}
