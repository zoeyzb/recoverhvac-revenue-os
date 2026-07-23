"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

const metrics = [
  { label: "Recovered revenue", value: process.env.NEXT_PUBLIC_RECOVER_REVENUE || "—", detail: "Attributed revenue" },
  { label: "Calls handled", value: process.env.NEXT_PUBLIC_RECOVER_CALLS || "—", detail: "Inbound and outbound" },
  { label: "Bookings", value: process.env.NEXT_PUBLIC_RECOVER_BOOKINGS || "—", detail: "Confirmed appointments" },
  { label: "Customers", value: process.env.NEXT_PUBLIC_RECOVER_CUSTOMERS || "—", detail: "Active customer records" },
];

const actions = [
  { label: "View conversations", href: "/app/conversations", icon: "phone" as const },
  { label: "Open calendar", href: "/app/calendar", icon: "calendar" as const },
  { label: "Review revenue", href: "/app/revenue", icon: "chart" as const },
  { label: "Connect systems", href: "/app/integrations", icon: "plug" as const },
];

export default function FrontendDashboard() {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [range, setRange] = useState("30 days");
  const progress = useMemo(() => [72, 88, 61, 94, 79, 86, 91], []);

  function handleAction(label: string, href: string) {
    setNotice(`${label} opened.`);
    router.push(href);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#181a16", color: "#f3f0e8", padding: "28px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#d7ff4f", color: "#181a16", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 20 }}>R</div>
            <div><strong style={{ display: "block", fontSize: 18 }}>Recover</strong><span style={{ opacity: .66 }}>Revenue OS</span></div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={range} onChange={(e) => setRange(e.target.value)} style={{ background: "#23251f", color: "#f3f0e8", border: "1px solid #3a3d34", borderRadius: 10, padding: "10px 12px" }}>
              <option>7 days</option><option>30 days</option><option>90 days</option>
            </select>
            <button onClick={() => router.push("/app/integrations")} style={{ border: 0, borderRadius: 10, padding: "11px 16px", fontWeight: 700, background: "#d7ff4f", color: "#181a16", cursor: "pointer" }}>Connect backend</button>
          </div>
        </header>

        <section style={{ background: "#f3f0e8", color: "#181a16", borderRadius: 24, padding: 28, marginBottom: 22 }}>
          <span style={{ textTransform: "uppercase", letterSpacing: ".12em", fontSize: 12, fontWeight: 800 }}>Operating overview · {range}</span>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: .98, margin: "14px 0 12px" }}>Turn missed demand into booked revenue.</h1>
          <p style={{ maxWidth: 720, fontSize: 18, opacity: .72 }}>Your calls, bookings, customers and attributed revenue in one operator workspace. Backend integrations can replace the public environment values without changing this interface.</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 22 }}>
          {metrics.map((metric) => (
            <article key={metric.label} style={{ background: "#23251f", border: "1px solid #34372e", borderRadius: 18, padding: 20 }}>
              <span style={{ opacity: .64, fontSize: 14 }}>{metric.label}</span>
              <strong style={{ display: "block", fontSize: 34, margin: "10px 0 5px" }}>{metric.value}</strong>
              <small style={{ opacity: .52 }}>{metric.detail}</small>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(280px,.6fr)", gap: 16 }}>
          <article style={{ background: "#23251f", border: "1px solid #34372e", borderRadius: 20, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><div><strong style={{ fontSize: 20 }}>Performance</strong><div style={{ opacity: .55, marginTop: 4 }}>Frontend analytics view</div></div><span style={{ color: "#d7ff4f", fontWeight: 800 }}>Live-ready</span></div>
            <div style={{ height: 230, display: "flex", alignItems: "end", gap: 12 }}>
              {progress.map((height, index) => <div key={index} title={`${height}%`} style={{ flex: 1, height: `${height}%`, borderRadius: "10px 10px 3px 3px", background: "linear-gradient(180deg,#d7ff4f,#a6c93b)" }} />)}
            </div>
          </article>

          <article style={{ background: "#23251f", border: "1px solid #34372e", borderRadius: 20, padding: 22 }}>
            <strong style={{ fontSize: 20 }}>Quick actions</strong>
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {actions.map((action) => <button key={action.label} onClick={() => handleAction(action.label, action.href)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#2b2e27", border: "1px solid #3b3f35", color: "#f3f0e8", borderRadius: 12, padding: "13px 14px", cursor: "pointer", textAlign: "left" }}><span style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon name={action.icon} size={16} />{action.label}</span><Icon name="arrow" size={15} /></button>)}
            </div>
            {notice && <div role="status" style={{ marginTop: 14, padding: 10, borderRadius: 10, background: "#d7ff4f", color: "#181a16", fontWeight: 700 }}>{notice}</div>}
          </article>
        </section>
      </div>
    </main>
  );
}
