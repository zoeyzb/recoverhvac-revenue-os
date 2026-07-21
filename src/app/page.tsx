import Link from "next/link";
import { Icon } from "@/components/icon";
import "./landing.css";

const capabilities = [
  ["scan", "Evidence-first audits", "Run full browser and Lighthouse checks, preserve proof, and publish a clear opportunity report."],
  ["phone", "Natural revenue recovery", "Handle missed calls, estimate follow-up, review requests, and qualified outreach across voice, SMS, and email."],
  ["workflow", "One reliable autopilot", "Move every event through policy checks, approvals, retries, suppression, and a visible dead-letter queue."],
  ["chart", "Revenue you can prove", "Connect the conversation, booking, payment, cost, and attribution trail without invented numbers."],
] as const;

const integrations = ["Twilio", "LiveKit", "OpenAI", "Supabase", "Stripe", "Resend", "Google Calendar", "Twenty CRM", "ServiceTitan", "Housecall Pro", "Jobber", "QuickBooks"];

export default function LandingPage() {
  return <main className="landing">
    <nav className="landing-nav">
      <Link className="landing-brand" href="/"><span className="brand-sigil"><Icon name="wind" size={18}/></span><strong>Recover</strong></Link>
      <div className="nav-links"><a href="#product">Product</a><a href="#how">How it works</a><a href="#integrations">Integrations</a><a href="#pricing">Pricing</a></div>
      <div className="nav-actions"><Link className="text-link" href="/owner/login">Owner login</Link><a className="pill dark" href="#contact">Book a revenue audit <Icon name="arrow" size={14}/></a></div>
    </nav>

    <section className="landing-hero">
      <div className="hero-copy">
        <span className="announcement"><i/> Built for HVAC revenue teams</span>
        <h1>Turn missed demand into <em>booked revenue.</em></h1>
        <p>Recover is the AI revenue operating system that finds conversion gaps, follows up across every channel, books qualified work, and proves what came back.</p>
        <div className="hero-actions"><a className="pill dark large" href="#contact">See Recover in action <Icon name="arrow" size={16}/></a><a className="pill light large" href="#product">Explore the platform</a></div>
        <div className="trust-row"><span><Icon name="check" size={14}/> Evidence-backed</span><span><Icon name="check" size={14}/> Approval controls</span><span><Icon name="check" size={14}/> No fake revenue</span></div>
      </div>
      <DashboardPreview/>
    </section>

    <section className="logo-cloud"><p>Connects the tools already running your business</p><div>{integrations.slice(0,7).map(x=><span key={x}>{x}</span>)}</div></section>

    <section className="landing-section" id="product"><div className="section-intro"><span>ONE OPERATING SYSTEM</span><h2>From unanswered call to verified payment.</h2><p>One clean workflow connects acquisition, conversations, bookings, payments, and the evidence behind every outcome.</p></div><div className="capability-grid">{capabilities.map(([icon,title,body],i)=><article key={title}><div className="feature-number">0{i+1}</div><span className="feature-icon"><Icon name={icon} size={20}/></span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="workflow-section" id="how"><div className="workflow-copy"><span className="section-label">AUTOPILOT WITH GUARDRAILS</span><h2>Hands-off does not mean out of control.</h2><p>Recover acts automatically where it is safe, pauses when approval is required, and makes every failure visible.</p><ul><li><Icon name="check" size={15}/> Verified signals before outreach</li><li><Icon name="check" size={15}/> Consent, suppression, quiet hours, and attempt limits</li><li><Icon name="check" size={15}/> Retries, recovery, and human escalation</li></ul></div><div className="flow-card"><div className="flow-head"><span>Recovery workflow</span><b>Running</b></div>{["Missed call received","Policy & consent check","AI conversation","Appointment booked","Payment attributed"].map((x,i)=><div className="flow-row" key={x}><i>{i+1}</i><span>{x}</span><b>{i<3?"Complete":i===3?"Ready":"Waiting"}</b></div>)}</div></section>

    <section className="landing-section integrations-section" id="integrations"><div className="section-intro"><span>CONNECTED BY DESIGN</span><h2>Your stack, orchestrated.</h2><p>Secure provider connections live in the private owner dashboard and feed one consistent automation runtime.</p></div><div className="integration-cloud">{integrations.map(x=><span key={x}>{x}</span>)}</div><p className="integration-note">28 provider connections available in the owner workspace.</p></section>

    <section className="price-section" id="pricing"><div><span className="section-label">SIMPLE COMMERCIAL MODEL</span><h2>Built around recovered revenue.</h2><p>Start with a verified revenue-leak audit. Activation and usage are scoped to your locations, workflows, and channels—no mystery dashboard numbers.</p></div><a className="pill ivory large" href="#contact">Request a tailored plan <Icon name="arrow" size={16}/></a></section>

    <section className="cta-section" id="contact"><span>READY TO RECOVER MORE?</span><h2>Your next booked job may already be waiting.</h2><p>See where demand is leaking and what Recover can automate safely.</p><a className="pill ivory large" href="mailto:hello@recoverhvac.com?subject=Recover%20revenue%20audit">Book a revenue audit <Icon name="arrow" size={16}/></a></section>
    <footer><Link className="landing-brand" href="/"><span className="brand-sigil"><Icon name="wind" size={18}/></span><strong>Recover</strong></Link><p>AI revenue recovery for modern HVAC operators.</p><Link href="/owner/login">Owner access</Link></footer>
  </main>
}

function DashboardPreview(){return <div className="preview-wrap"><div className="preview-glow"/><div className="preview-window"><div className="preview-sidebar"><span className="mini-brand">R</span>{["grid","phone","users","workflow","chart","plug"].map((x,i)=><i className={i===0?"active":""} key={x}><Icon name={x as never} size={14}/></i>)}</div><div className="preview-main"><div className="preview-top"><span>Revenue overview</span><b>Autopilot ready</b></div><div className="preview-title"><small>THIS MONTH</small><strong>Every recovery, connected.</strong><p>Live data appears after your providers are connected.</p></div><div className="preview-stats"><article><span>Recovered revenue</span><strong>Verified only</strong><i/></article><article><span>Bookings</span><strong>Source linked</strong><i/></article><article><span>Automation health</span><strong>All visible</strong><i/></article></div><div className="preview-panels"><article><span>Revenue attribution</span><div className="chart-bars">{[38,55,43,72,65,88,82].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></article><article><span>Active recovery</span>{["Missed call","Estimate follow-up","Review request"].map((x,i)=><p key={x}><i className={i===0?"live":""}/>{x}<b>{i===0?"Running":"Ready"}</b></p>)}</article></div></div></div></div>}
