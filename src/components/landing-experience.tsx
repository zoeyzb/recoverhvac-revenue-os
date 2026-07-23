"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import {
  getPlan,
  getWalkthrough,
  plans,
  publishedTestimonials,
  walkthroughs,
} from "@/lib/landing-content";

const heroTools: { id: string; label: string; icon: IconName; task: string }[] = [
  { id: "overview", label: "Overview", icon: "grid", task: "Return a missed call" },
  { id: "calls", label: "Calls", icon: "phone", task: "Review call routing" },
  { id: "calendar", label: "Calendar", icon: "calendar", task: "Confirm booking rules" },
  { id: "website", label: "Website", icon: "scan", task: "Review conversion finding" },
  { id: "automations", label: "Automations", icon: "workflow", task: "Approve follow-up cadence" },
  { id: "revenue", label: "Revenue", icon: "chart", task: "Verify attributed payment" },
];

export function HeroProductPreview() {
  const [activeTool, setActiveTool] = useState(heroTools[0]);
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="product-preview" aria-label="Interactive Recover workspace example">
      <div className="preview-toolbar">
        <span><i /> Interactive workspace example</span>
        <b>MANAGED BY RECOVER</b>
      </div>
      <div className="preview-body">
        <aside aria-label="Workspace sections">
          <b>R</b>
          {heroTools.map((tool) => (
            <button
              type="button"
              className={activeTool.id === tool.id ? "active" : ""}
              aria-label={tool.label}
              aria-pressed={activeTool.id === tool.id}
              onClick={() => {
                setActiveTool(tool);
                setReviewOpen(false);
              }}
              key={tool.id}
            >
              <Icon name={tool.icon} size={16} />
            </button>
          ))}
        </aside>
        <div className="preview-content">
          <div className="preview-title">
            <span><small>{activeTool.label.toUpperCase()}</small><strong>Good morning, Alex.</strong></span>
            <button type="button" onClick={() => setReviewOpen((open) => !open)}>
              {reviewOpen ? "Close review" : "Review 2 items"}
            </button>
          </div>
          {reviewOpen ? (
            <div className="preview-review" role="status">
              <small>READY FOR YOUR REVIEW</small>
              <button type="button"><span>01</span><strong>{activeTool.task}</strong><b>Open →</b></button>
              <button type="button"><span>02</span><strong>Approve estimate follow-up</strong><b>Open →</b></button>
            </div>
          ) : (
            <div className="preview-priority">
              <span><Icon name={activeTool.icon} size={17} /></span>
              <div><small>NEEDS YOUR APPROVAL</small><strong>{activeTool.task}</strong><p>Recover prepared the next step</p></div>
              <b>Review →</b>
            </div>
          )}
          <div className="preview-columns">
            <article>
              <small>RECOVER ACTIVITY</small>
              <div><i className="green" /><span><strong>New inquiry answered</strong><small>Call · qualified and routed</small></span><b>Now</b></div>
              <div><i className="amber" /><span><strong>Estimate follow-up ready</strong><small>Email · waiting for approval</small></span><b>18m</b></div>
            </article>
            <article>
              <small>SETUP STATUS</small>
              <div><span><strong>Calendar</strong><small>Connection in progress</small></span><b>In progress</b></div>
              <div><span><strong>Website monitor</strong><small>Audit scheduled</small></span><b>Ready</b></div>
            </article>
          </div>
          <div className="preview-status"><span><Icon name="shield" size={14} /> You approve important decisions</span><span>Example data · not customer results</span></div>
        </div>
      </div>
    </div>
  );
}

export function InteractiveWalkthrough() {
  const [activeId, setActiveId] = useState(walkthroughs[0].id);
  const active = getWalkthrough(activeId);

  return (
    <section className="experience-section" id="demo">
      <div className="experience-heading">
        <span>SEE RECOVER IN ACTION</span>
        <h2>Pick a leak. See how Recover closes it.</h2>
        <p>Three common revenue leaks. One clear handoff from the missed moment to the next action.</p>
      </div>
      <div className="experience-layout">
        <div className="experience-tabs" aria-label="Choose a recovery workflow">
          {walkthroughs.map((item, index) => (
            <button
              type="button"
              aria-pressed={active.id === item.id}
              className={active.id === item.id ? "active" : ""}
              onClick={() => setActiveId(item.id)}
              key={item.id}
            >
              <span>0{index + 1}</span><Icon name={item.icon} size={18} /><strong>{item.label}</strong><Icon name="arrow" size={14} />
            </button>
          ))}
        </div>
        <article className="experience-panel" aria-live="polite">
          <div className="experience-copy">
            <span>{active.eyebrow}</span>
            <h3>{active.title}</h3>
            <p>{active.body}</p>
            <small><Icon name="shield" size={15} /> {active.approval}</small>
          </div>
          <div className="workflow-preview">
            <span className="example-label">EXAMPLE WORKFLOW</span>
            <div><i>01</i><span><small>SIGNAL</small><strong>{active.signal}</strong></span></div>
            <div><i>02</i><span><small>RECOVER</small><strong>{active.action}</strong></span></div>
            <div className="complete"><i><Icon name="check" size={14} /></i><span><small>ACCOUNTABLE NEXT STEP</small><strong>{active.result}</strong></span></div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function PricingPlans() {
  const [selectedId, setSelectedId] = useState(plans[1].id);
  const selected = getPlan(selectedId);

  return (
    <>
      <div className="plan-grid">
        {plans.map((plan, index) => (
          <article key={plan.id} className={selectedId === plan.id ? "selected" : ""}>
            {index === 1 && <b className="plan-label">MOST REQUESTED</b>}
            <button type="button" className="plan-select" aria-pressed={selectedId === plan.id} onClick={() => setSelectedId(plan.id)}>
              <span><strong>{plan.name}</strong><small>{plan.note}</small></span>
              <i>{selectedId === plan.id ? "Selected" : "Compare"}</i>
            </button>
            <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
            <p className="plan-fit">{plan.fit}</p>
            <ul>{plan.features.map((feature) => <li key={feature}><Icon name="check" size={14} />{feature}</li>)}</ul>
            <small className="plan-disclosure">{plan.disclosure}</small>
            <Link className={selectedId === plan.id ? "solid-button full" : "outline-button full"} href={`/get-started?service=${encodeURIComponent(plan.name)}`}>
              Choose {plan.name}<Icon name="arrow" size={15} />
            </Link>
          </article>
        ))}
      </div>
      <p className="selected-plan-note" aria-live="polite"><strong>{selected.name}:</strong> {selected.fit}</p>
    </>
  );
}

export function ProofSection() {
  if (publishedTestimonials.length > 0) {
    return (
      <section className="proof-section" aria-labelledby="proof-title">
        <div><span>VERIFIED CUSTOMER STORIES</span><h2 id="proof-title">The people doing the work say it best.</h2></div>
        <div className="testimonial-grid">{publishedTestimonials.map((item) => <blockquote key={`${item.name}-${item.company}`}><p>“{item.quote}”</p><footer><strong>{item.name}</strong><span>{item.company}</span></footer></blockquote>)}</div>
      </section>
    );
  }

  return (
    <section className="proof-section" aria-labelledby="proof-title">
      <div className="proof-visual" aria-label="Example evidence chain">
        <div className="proof-orbit proof-orbit-one" />
        <div className="proof-orbit proof-orbit-two" />
        <div className="proof-receipt receipt-call">
          <span><Icon name="phone" size={16} /> CALL</span>
          <strong>Missed call recovered</strong>
          <small>Provider event · 10:42 AM</small>
        </div>
        <div className="proof-receipt receipt-booking">
          <span><Icon name="calendar" size={16} /> BOOKING</span>
          <strong>Appointment confirmed</strong>
          <small>Source conversation linked</small>
        </div>
        <div className="proof-receipt receipt-revenue">
          <span><Icon name="dollar" size={16} /> REVENUE</span>
          <strong>Payment verified</strong>
          <small>Attribution chain complete</small>
        </div>
      </div>
      <div className="proof-copy">
        <span>PROOF AT EVERY HANDOFF</span>
        <h2 id="proof-title">Know what happened. Know what paid.</h2>
        <p>Recover keeps the source attached from first contact to booked work and verified revenue.</p>
        <div className="evidence-list">
          <article><b>01</b><span><h3>Conversation</h3><p>Who contacted you, when, on which channel, and what happened next.</p></span><Icon name="phone" size={20} /></article>
          <article><b>02</b><span><h3>Booking</h3><p>The confirmed appointment stays linked to the conversation that created it.</p></span><Icon name="calendar" size={20} /></article>
          <article><b>03</b><span><h3>Revenue</h3><p>Revenue is counted only after a verified payment event, with costs visible.</p></span><Icon name="dollar" size={20} /></article>
        </div>
      </div>
    </section>
  );
}
