import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import "./landing.css";

const capabilities: { icon: IconName; title: string; body: string; tag: string }[] = [
  { icon: "phone", title: "AI phone & text", body: "Recover answers missed demand, qualifies inquiries, transfers urgent conversations, and keeps follow-up moving after hours.", tag: "Calls · SMS" },
  { icon: "calendar", title: "Booking that stays in sync", body: "We connect availability, book the right calendar, and carry cancellations or reschedules back into the conversation.", tag: "Calendar" },
  { icon: "scan", title: "Website & SEO recovery", body: "We inspect speed, local visibility, conversion paths, technical SEO, and broken customer journeys, then prepare the work.", tag: "Growth" },
  { icon: "refresh", title: "Follow-up handled for you", body: "Recover runs approved sequences for estimates, leads, reviews, renewals, and customers who went quiet.", tag: "Automation" },
  { icon: "users", title: "One customer timeline", body: "Calls, messages, bookings, approvals, and outcomes stay together instead of scattered across tabs.", tag: "Inbox" },
  { icon: "chart", title: "Revenue with receipts", body: "Conversations connect to bookings and verified payments, with provider evidence and operating costs attached.", tag: "Attribution" },
];

const packages = [
  { name: "Audit", note: "Find the leaks", features: ["Website and local-conversion audit", "Evidence-backed recovery plan", "Priority recommendations"] },
  { name: "Front Office", note: "Stop losing demand", features: ["AI phone, SMS, and follow-up", "Calendar and inbox connection", "Managed launch and monitoring"] },
  { name: "Complete Recovery", note: "Operate the full system", features: ["Everything in Front Office", "Website, SEO, reviews, and attribution", "Ongoing optimization and reporting"] },
] as const;

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
      <ProductPreview />
    </section>

    <section className="outcome-bar"><span>Never miss the call</span><span>Follow up on time</span><span>Fill the calendar</span><span>Fix conversion gaps</span><span>Know what paid</span></section>

    <section className="market-section capability-section" id="product">
      <div className="section-heading"><span>ONE MANAGED SYSTEM</span><h2>The work between “new lead” and “paid customer.”</h2><p>You authorize the systems you already use. Recover handles the technical setup, prepares the playbooks, monitors the work, and shows you what needs attention.</p></div>
      <div className="capability-grid">{capabilities.map(item=><article key={item.title}><div className="capability-top"><span>{item.tag}</span><i><Icon name={item.icon} size={20}/></i></div><h3>{item.title}</h3><p>{item.body}</p><Link href="/get-started">Include this service <Icon name="arrow" size={14}/></Link></article>)}</div>
    </section>

    <section className="flow-section" id="how">
      <div><span>HOW RECOVER WORKS</span><h2>You tell us what is being lost. We build the recovery system.</h2><p>No workflow builder. No API-key maze. No technical dashboard before you are ready. Recover learns the business, connects the systems with you, prepares the launch plan, and operates the approved work.</p><Link className="outline-button light" href="/get-started">Start the intake <Icon name="arrow" size={15}/></Link></div>
      <ol><li><b>01</b><span><strong>Tell us about the business</strong><small>Name, service area, website, phone, and the opportunities being lost.</small></span></li><li><b>02</b><span><strong>Choose the outcome</strong><small>Audit only, missed-call recovery, follow-up, reviews, SEO, or the complete system.</small></span></li><li><b>03</b><span><strong>We connect and configure</strong><small>Recover handles the technical setup. You authorize the systems you already use.</small></span></li><li><b>04</b><span><strong>Review, launch, and measure</strong><small>You approve the plan, then see conversations, bookings, issues, costs, and verified results.</small></span></li></ol>
    </section>

    <section className="market-section pricing-section" id="pricing">
      <div className="section-heading"><span>DONE-FOR-YOU SERVICES</span><h2>Start with the leak that costs the most.</h2><p>Choose the outcome. We confirm scope and pricing before connecting anything or running external actions.</p></div>
      <div className="plan-grid">{packages.map((plan,index)=><article key={plan.name} className={index===1?"featured":""}>{index===1&&<b className="plan-label">MOST REQUESTED</b>}<span className="plan-name">{plan.name}</span><small>{plan.note}</small><ul>{plan.features.map(feature=><li key={feature}><Icon name="check" size={14}/>{feature}</li>)}</ul><Link className={index===1?"solid-button full":"outline-button full"} href={`/get-started?service=${encodeURIComponent(plan.name)}`}>Choose {plan.name}<Icon name="arrow" size={15}/></Link></article>)}</div>
      <p className="price-note">No free-trial trap. Scope, provider costs, launch requirements, and ongoing fees are confirmed before work begins.</p>
    </section>

    <section className="closing-section"><span>YOUR NEXT LEAD IS ALREADY ON THE WAY</span><h2>Make sure the next step is ready.</h2><p>Tell us what your business is losing. Recover will prepare the right service plan and the setup checklist.</p><Link className="solid-button inverse large" href="/get-started">Get my recovery plan <Icon name="arrow" size={16}/></Link></section>
    <footer className="market-footer"><Brand/><p>Managed AI revenue operations for service businesses.</p><div><Link href="/login">Client login</Link><a href="#pricing">Services</a><a href="mailto:hello@recoverhq.com">Contact</a><Link href="/owner/login">Operator access</Link></div></footer>
  </main>;
}

function Brand(){return <Link className="market-brand" href="/"><span className="brand-symbol">R</span><strong>Recover</strong></Link>}

function ProductPreview(){return <div className="product-preview" aria-label="Recover customer control center preview">
  <div className="preview-toolbar"><span><i/> What your team sees</span><b>MANAGED BY RECOVER</b></div>
  <div className="preview-body"><aside><b>R</b>{["grid","phone","calendar","scan","workflow","chart"].map((name,index)=><i className={index===0?"active":""} key={name}><Icon name={name as IconName} size={16}/></i>)}</aside><div className="preview-content"><div className="preview-title"><span><small>TODAY</small><strong>Good morning, Alex.</strong></span><button>Review 2 items</button></div><div className="preview-priority"><span><Icon name="phone" size={17}/></span><div><small>NEEDS YOUR APPROVAL</small><strong>Return a missed call</strong><p>New inquiry · Recover prepared the next step</p></div><b>Review →</b></div><div className="preview-columns"><article><small>RECOVER ACTIVITY</small><div><i className="green"/><span><strong>New inquiry answered</strong><small>Call · qualified and routed</small></span><b>Now</b></div><div><i className="amber"/><span><strong>Estimate follow-up ready</strong><small>Email · waiting for approval</small></span><b>18m</b></div></article><article><small>SETUP STATUS</small><div><span><strong>Calendar</strong><small>Recover is connecting it</small></span><b>In progress</b></div><div><span><strong>Website monitor</strong><small>Audit scheduled</small></span><b>Ready</b></div></article></div><div className="preview-status"><span><Icon name="shield" size={14}/> You approve important decisions</span><span>Recover handles the setup</span></div></div></div>
</div>}
