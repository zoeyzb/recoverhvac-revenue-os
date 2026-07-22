import Link from "next/link";
import { Icon } from "@/components/icon";
import { RecoveryCalculator } from "@/components/recovery-calculator";
import "./landing.css";

const services = [
  {
    icon: "phone" as const,
    number: "01",
    title: "Missed-call rescue",
    body: "Respond while intent is still hot, qualify the request, answer approved questions, and move ready homeowners toward a booked slot.",
    items: ["After-hours and overflow coverage", "AI voice, SMS, and human handoff", "Booking and call-outcome evidence"],
  },
  {
    icon: "send" as const,
    number: "02",
    title: "Estimate follow-up",
    body: "Give unsold estimates a consistent, respectful follow-up sequence without asking CSRs to remember every next touch.",
    items: ["Estimate-stage triggers", "Approval-ready messages", "Reply, opt-out, and attribution tracking"],
  },
  {
    icon: "refresh" as const,
    number: "03",
    title: "Customer reactivation",
    body: "Bring due maintenance, dormant customers, and unfinished conversations back into one controlled revenue workflow.",
    items: ["Membership and tune-up reminders", "Dormant-customer campaigns", "Quiet hours, limits, and suppression"],
  },
] as const;

type Plan = {
  name: string;
  price: string;
  cadence: string;
  setup?: string;
  description: string;
  features: readonly string[];
  cta: string;
  subject: string;
  featured?: boolean;
};

const plans: readonly Plan[] = [
  {
    name: "Revenue Leak Audit",
    price: "$297",
    cadence: "one time",
    description: "For HVAC owners who need proof before adding another tool.",
    features: ["Website and conversion-path audit", "Missed-demand workflow review", "Prioritized recovery plan", "Recorded findings walkthrough"],
    cta: "Book the audit",
    subject: "Recover Revenue Leak Audit",
  },
  {
    name: "Recovery Core",
    price: "$997",
    cadence: "/ month",
    setup: "+ $750 launch",
    description: "For one-location teams ready to automate the highest-value leak first.",
    features: ["One live recovery workflow", "Voice, SMS, or email orchestration", "Calendar and CRM connection", "Owner dashboard and attribution", "Monthly optimization review"],
    cta: "Start Recovery Core",
    subject: "Recover Core plan",
    featured: true,
  },
  {
    name: "Revenue OS",
    price: "$1,997",
    cadence: "/ month",
    setup: "+ $1,500 launch",
    description: "For growing shops running several recovery motions across the customer journey.",
    features: ["Up to four recovery workflows", "Inbound and outbound channels", "Advanced routing and approvals", "Verified revenue and cost ledger", "Priority optimization support"],
    cta: "Build my revenue system",
    subject: "Recover Revenue OS plan",
  },
];

const faqs = [
  ["Does Recover replace our CRM?", "No. Recover sits across your existing phone, CRM, calendar, payments, and field-service tools. It coordinates recovery work and writes verified outcomes back where supported."],
  ["Will an AI pretend to be a person?", "No. Voice experiences identify the represented business and can disclose that they are an automated assistant. Human transfer remains available for situations that need judgment."],
  ["Can it message anyone automatically?", "No. Live outreach passes consent, suppression, quiet-hour, attempt-limit, tenant-policy, and approval checks before a provider is allowed to send."],
  ["How quickly can we launch?", "A narrow first workflow can usually be configured after access, routing, scripts, calendars, and test recipients are approved. Timing depends on your providers and integration access."],
  ["Are voice and SMS fees included?", "No. Carrier, voice, email, model, and other provider usage are billed separately by the connected providers or scoped in your proposal. The base prices cover Recover software and the listed service."],
  ["Do you guarantee recovered revenue?", "No honest provider can. Recover shows the evidence chain from conversation to booking and payment, so you can judge performance from real outcomes rather than projections."],
] as const;

export default function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link className="landing-brand" href="/">
          <span className="brand-sigil"><Icon name="wind" size={18} /></span>
          <span><strong>Recover</strong><small>HVAC REVENUE OS</small></span>
        </Link>
        <div className="nav-links">
          <a href="#services">Services</a><a href="#platform">Platform</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
        </div>
        <div className="nav-actions">
          <Link className="text-link" href="/owner/login">Owner login</Link>
          <a className="pill dark" href="mailto:hello@recoverhvac.com?subject=Recover%20strategy%20call">Book a strategy call <Icon name="arrow" size={14} /></a>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="announcement"><i /> Revenue recovery built for HVAC</span>
          <h1>Stop paying for leads your shop <em>never closes.</em></h1>
          <p>Recover responds to missed demand, follows up unsold work, books qualified opportunities, and connects every claimed dollar to real provider evidence.</p>
          <div className="hero-actions">
            <a className="pill dark large" href="mailto:hello@recoverhvac.com?subject=Recover%20Revenue%20Leak%20Audit">Find my revenue leaks <Icon name="arrow" size={16} /></a>
            <a className="pill light large" href="#pricing">See pricing</a>
          </div>
          <div className="trust-row"><span><Icon name="check" size={14} /> Starts with one leak</span><span><Icon name="check" size={14} /> Human approval controls</span><span><Icon name="check" size={14} /> Verified outcomes only</span></div>
        </div>
        <RevenuePreview />
      </section>

      <section className="leak-strip" aria-label="Revenue recovery services">
        <span>Missed calls</span><i /><span>Unsold estimates</span><i /><span>After-hours demand</span><i /><span>Dormant customers</span><i /><span>Review follow-up</span>
      </section>

      <section className="landing-section service-section" id="services">
        <div className="section-intro split-intro">
          <div><span>WHAT WE RECOVER</span><h2>Three expensive leaks. One operating system.</h2></div>
          <p>Recover is not a generic chatbot. Each service is a measurable workflow with a trigger, a policy, a provider outcome, and an owner-visible next step.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => <article key={service.title}>
            <div className="service-top"><span>{service.number}</span><i><Icon name={service.icon} size={20} /></i></div>
            <h3>{service.title}</h3><p>{service.body}</p>
            <ul>{service.items.map((item) => <li key={item}><Icon name="check" size={14} />{item}</li>)}</ul>
          </article>)}
        </div>
      </section>

      <section className="calculator-section">
        <div className="calculator-copy"><span className="section-label">USE YOUR NUMBERS</span><h2>What could one unresolved leak be worth?</h2><p>Model the opportunity using your own missed demand and average completed-job value. We validate the inputs during the audit.</p></div>
        <RecoveryCalculator />
      </section>

      <section className="platform-section" id="platform">
        <div className="platform-copy">
          <span className="section-label">CONTROL, NOT CHAOS</span>
          <h2>Automation your owner can actually supervise.</h2>
          <p>Every workflow exposes what triggered it, why an action was allowed, what the provider returned, and where a human needs to step in.</p>
          <div className="platform-points">
            <div><Icon name="shield" size={18} /><span><strong>Policy before outreach</strong><small>Consent, suppression, quiet hours, limits, and approvals.</small></span></div>
            <div><Icon name="workflow" size={18} /><span><strong>Failures stay visible</strong><small>Queues, retries, blocked work, and human escalation.</small></span></div>
            <div><Icon name="chart" size={18} /><span><strong>Attribution has receipts</strong><small>Conversation, booking, payment, cost, and source trail.</small></span></div>
          </div>
        </div>
        <WorkflowPanel />
      </section>

      <section className="landing-section process-section">
        <div className="section-intro"><span>THE FIRST 30 DAYS</span><h2>Prove one workflow, then expand.</h2><p>A tight launch keeps risk low and makes the first performance review meaningful.</p></div>
        <ol>
          <li><b>01</b><span><strong>Diagnose</strong><small>Audit the real call, estimate, calendar, and payment path.</small></span></li>
          <li><b>02</b><span><strong>Connect</strong><small>Authorize only the providers the selected workflow needs.</small></span></li>
          <li><b>03</b><span><strong>Test</strong><small>Run allowlisted scenarios, failure states, and human handoffs.</small></span></li>
          <li><b>04</b><span><strong>Recover</strong><small>Launch with guardrails and review verified outcomes.</small></span></li>
        </ol>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-intro"><span>PUBLIC PRICING</span><h2>Start where the leak is clearest.</h2><p>No vague “contact sales” wall. Provider usage and unusual custom integration work are scoped separately before activation.</p></div>
        <div className="pricing-grid">
          {plans.map((plan) => <article key={plan.name} className={plan.featured ? "featured" : ""}>
            {plan.featured && <span className="popular">BEST FIRST AUTOMATION</span>}
            <h3>{plan.name}</h3><p>{plan.description}</p>
            <div className="price"><strong>{plan.price}</strong><span>{plan.cadence}</span></div>
            {"setup" in plan && <small className="setup-price">{plan.setup}</small>}
            <ul>{plan.features.map((item) => <li key={item}><Icon name="check" size={14} />{item}</li>)}</ul>
            <a className={plan.featured ? "pill dark full-pill" : "pill light full-pill"} href={`mailto:hello@recoverhvac.com?subject=${encodeURIComponent(plan.subject)}`}>{plan.cta}<Icon name="arrow" size={15} /></a>
          </article>)}
        </div>
        <p className="pricing-footnote">Prices cover one business location. Taxes and third-party provider usage are excluded. Multi-location and custom integration work receive a written scope before billing.</p>
      </section>

      <section className="landing-section faq-section" id="faq">
        <div className="section-intro"><span>STRAIGHT ANSWERS</span><h2>Before you trust automation with a lead.</h2></div>
        <div className="faq-grid">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="cta-section">
        <span>START WITH EVIDENCE</span><h2>Find the leak before buying the fix.</h2><p>Get a clear review of where demand is dropping, what can be recovered safely, and which workflow should launch first.</p>
        <div><a className="pill ivory large" href="mailto:hello@recoverhvac.com?subject=Recover%20Revenue%20Leak%20Audit">Book the $297 audit <Icon name="arrow" size={16} /></a><a href="#pricing">Compare plans</a></div>
      </section>
      <footer>
        <Link className="landing-brand" href="/"><span className="brand-sigil"><Icon name="wind" size={18} /></span><span><strong>Recover</strong><small>HVAC REVENUE OS</small></span></Link>
        <p>Recover missed demand. Prove what came back.</p>
        <div><a href="mailto:hello@recoverhvac.com">Contact</a><a href="#pricing">Pricing</a><Link href="/owner/login">Owner access</Link></div>
      </footer>
    </main>
  );
}

function RevenuePreview() {
  return <div className="preview-wrap"><div className="preview-glow" /><div className="preview-window">
    <div className="preview-head"><span><i /> Recovery queue</span><b>TEST MODE</b></div>
    <div className="preview-summary"><small>TODAY&apos;S PRIORITY</small><strong>3 conversations need a next step.</strong><p>Nothing sends until policy and provider checks pass.</p></div>
    <div className="preview-queue">
      <article><i className="hot"><Icon name="phone" size={15} /></i><span><strong>Missed call</strong><small>Awaiting qualification</small></span><b>Now</b></article>
      <article><i><Icon name="send" size={15} /></i><span><strong>Estimate follow-up</strong><small>Owner approval required</small></span><b>Review</b></article>
      <article><i><Icon name="calendar" size={15} /></i><span><strong>Maintenance reminder</strong><small>Inside quiet hours</small></span><b>8:00 AM</b></article>
    </div>
    <div className="preview-proof"><span><Icon name="shield" size={14} /> Consent checked</span><span><Icon name="chart" size={14} /> Source attached</span></div>
  </div></div>;
}

function WorkflowPanel() {
  const steps = [["Missed call received", "Provider event", "done"], ["Consent & policy check", "Allowed", "done"], ["Recovery conversation", "In progress", "live"], ["Appointment outcome", "Waiting", "wait"], ["Payment attribution", "Waiting", "wait"]] as const;
  return <div className="workflow-panel"><div className="workflow-title"><span><i /> LIVE WORKFLOW</span><b>Missed-call rescue</b></div>{steps.map(([title, state, kind], index) => <div className={`workflow-step ${kind}`} key={title}><i>{kind === "done" ? <Icon name="check" size={13} /> : index + 1}</i><span><strong>{title}</strong><small>{state}</small></span></div>)}<footer><Icon name="shield" size={14} /> Every state change keeps its evidence.</footer></div>;
}
