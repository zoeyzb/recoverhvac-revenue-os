import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import {
  HeroProductPreview,
  InteractiveWalkthrough,
  PricingPlans,
  ProofSection,
} from "@/components/landing-experience";
import { faqs } from "@/lib/landing-content";
import "./landing.css";

const capabilities: { icon: IconName; title: string; body: string; tag: string; size?: string }[] = [
  { icon: "phone", title: "AI front office", body: "Recover answers missed demand, qualifies inquiries, transfers urgent conversations, and keeps approved follow-up moving after hours.", tag: "Calls · SMS · Follow-up", size: "wide" },
  { icon: "calendar", title: "Booking that stays in sync", body: "We connect availability, book the right calendar, and carry cancellations or reschedules back into the conversation.", tag: "Calendar" },
  { icon: "scan", title: "Website & SEO recovery", body: "We inspect speed, local visibility, conversion paths, technical SEO, and broken customer journeys, then prepare the work.", tag: "Growth" },
  { icon: "users", title: "One customer timeline", body: "Calls, messages, bookings, approvals, and outcomes stay together instead of scattered across tabs.", tag: "Inbox", size: "wide" },
  { icon: "chart", title: "Revenue with receipts", body: "Conversations connect to bookings and verified payments, with provider evidence and operating costs attached.", tag: "Attribution", size: "wide" },
];

export default function LandingPage() {
  return <main className="market-site">
    <nav className="market-nav" aria-label="Primary navigation">
      <Brand />
      <div className="market-links"><a href="#product">What we handle</a><a href="#how">How it works</a><a href="#pricing">Services</a></div>
      <div className="market-actions"><Link className="link-button" href="/login">Client login</Link><Link className="solid-button" href="/get-started">Get my recovery plan <Icon name="arrow" size={15}/></Link></div>
    </nav>

    <section className="market-hero">
      <div className="hero-message">
        <span className="eyebrow"><i/> Managed AI revenue operations for service businesses</span>
        <h1>Every missed opportunity gets a next step.</h1>
        <p>Recover handles missed calls, estimate follow-up, booking, review requests, website conversion gaps, and revenue tracking without making your team build or manage automations.</p>
        <div className="hero-buttons"><Link className="solid-button large" href="/get-started">Get my recovery plan <Icon name="arrow" size={16}/></Link><a className="outline-button large" href="#how">See how it works</a></div>
        <div className="hero-facts"><span><Icon name="check" size={14}/> Setup handled for you</span><span><Icon name="check" size={14}/> Approval before launch</span><span><Icon name="check" size={14}/> Cancel anytime</span></div>
      </div>
      <HeroProductPreview />
    </section>

    <section className="outcome-bar"><span>Never miss the call</span><span>Follow up on time</span><span>Fill the calendar</span><span>Fix conversion gaps</span><span>Know what paid</span></section>

    <section className="stack-strip" aria-label="Systems Recover can connect during setup">
      <span>WORKS AROUND YOUR STACK</span>
      <div><b>Phone + SMS</b><b>Gmail + Outlook</b><b>Google Calendar</b><b>Stripe</b><b>Your website</b></div>
      <small>Connection availability is confirmed during intake.</small>
    </section>

    <InteractiveWalkthrough />

    <section className="market-section capability-section" id="product">
      <div className="section-heading"><span>ONE MANAGED SYSTEM</span><h2>The work between “new lead” and “paid customer.”</h2><p>You authorize the systems you already use. Recover handles the technical setup, prepares the playbooks, monitors the work, and shows you what needs attention.</p></div>
      <div className="capability-grid">{capabilities.map(item=><article className={item.size ?? ""} key={item.title}><div className="capability-top"><span>{item.tag}</span><i><Icon name={item.icon} size={20}/></i></div><h3>{item.title}</h3><p>{item.body}</p><Link href="/get-started">Include this service <Icon name="arrow" size={14}/></Link></article>)}</div>
    </section>

    <section className="flow-section" id="how">
      <div><span>HOW RECOVER WORKS</span><h2>You tell us what is being lost. We build the recovery system.</h2><p>No workflow builder. No API-key maze. No technical dashboard before you are ready. Recover learns the business, connects the systems with you, prepares the launch plan, and operates the approved work.</p><Link className="outline-button light" href="/get-started">Start the intake <Icon name="arrow" size={15}/></Link></div>
      <ol><li><b>01</b><span><strong>Tell us about the business</strong><small>Name, service area, website, phone, and the opportunities being lost.</small></span></li><li><b>02</b><span><strong>Choose the outcome</strong><small>Audit only, missed-call recovery, follow-up, reviews, SEO, or the complete system.</small></span></li><li><b>03</b><span><strong>We connect and configure</strong><small>Recover handles the technical setup. You authorize the systems you already use.</small></span></li><li><b>04</b><span><strong>Review, launch, and measure</strong><small>You approve the plan, then see conversations, bookings, issues, costs, and verified results.</small></span></li></ol>
    </section>

    <section className="market-section pricing-section" id="pricing">
      <div className="section-heading"><span>TRANSPARENT STARTING PRICES</span><h2>Start with the leak that costs the most.</h2><p>Compare the outcome, fit, and starting price. Final scope, setup, provider usage, and launch requirements are confirmed before work begins.</p></div>
      <PricingPlans />
    </section>

    <ProofSection />

    <section className="faq-section" id="faq">
      <div className="faq-heading"><span>THE QUESTIONS WORTH ASKING</span><h2>Clear before anything connects.</h2><p>No mystery automation, hidden customer claims, or surprise provider bill.</p></div>
      <div className="faq-list">{faqs.map((item, index) => <details key={item.question} open={index === 0}><summary><span>0{index + 1}</span><strong>{item.question}</strong><i><Icon name="plus" size={17}/></i></summary><p>{item.answer}</p></details>)}</div>
    </section>

    <section className="closing-section"><span>YOUR NEXT LEAD IS ALREADY ON THE WAY</span><h2>Make sure the next step is ready.</h2><p>Tell us what your business is losing. Recover will prepare the right service plan and the setup checklist.</p><Link className="solid-button inverse large" href="/get-started">Get my recovery plan <Icon name="arrow" size={16}/></Link></section>
    <footer className="market-footer"><Brand/><p>Managed AI revenue operations for service businesses.</p><div><Link href="/login">Client login</Link><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="mailto:hello@recoverhq.com">Contact</a><Link href="/owner/login">Operator access</Link></div></footer>
  </main>;
}

function Brand(){return <Link className="market-brand" href="/"><span className="brand-symbol">R</span><strong>Recover</strong></Link>}
