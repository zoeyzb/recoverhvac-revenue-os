import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import "./landing.css";

const capabilities: { icon: IconName; title: string; body: string; tag: string }[] = [
  { icon: "phone", title: "AI phone & text", body: "Answer missed calls, qualify inquiries, transfer urgent conversations, and keep follow-up moving after hours.", tag: "Calls · SMS" },
  { icon: "calendar", title: "Booking that stays in sync", body: "Offer real availability, book the right calendar, and carry cancellations or reschedules back into the conversation.", tag: "Calendar" },
  { icon: "scan", title: "Website & SEO monitor", body: "Audit speed, conversion paths, technical SEO, and broken customer journeys—then turn findings into assigned work.", tag: "Growth" },
  { icon: "refresh", title: "Follow-up on autopilot", body: "Run approved sequences for estimates, leads, reviews, renewals, and customers who went quiet.", tag: "Automation" },
  { icon: "users", title: "One customer timeline", body: "Keep calls, messages, bookings, approvals, and outcomes together instead of scattered across tabs.", tag: "Inbox" },
  { icon: "chart", title: "Revenue with receipts", body: "Connect conversations to bookings and verified payments, with provider evidence and costs attached.", tag: "Attribution" },
];

type Plan = { name: string; price: string; note: string; features: readonly string[]; cta: string; featured?: boolean };
const plans: readonly Plan[] = [
  { name: "Starter", price: "$199", note: "For owner-led businesses", features: ["AI phone or messaging channel", "Shared inbox and follow-up", "One connected calendar", "Monthly website & SEO scan"], cta: "Start with Starter" },
  { name: "Growth", price: "$599", note: "For teams ready to automate", features: ["AI phone, SMS, and email", "Unlimited approved workflows", "Calendar, CRM, and payments", "Website, SEO, reviews, and attribution"], cta: "Start 14-day trial", featured: true },
  { name: "Scale", price: "$1,299", note: "For multi-team operations", features: ["Everything in Growth", "Multiple locations and routing", "Custom provider connections", "Priority launch and optimization"], cta: "Choose Scale" },
];

export default function LandingPage() {
  return <main className="market-site">
    <nav className="market-nav" aria-label="Primary navigation">
      <Brand />
      <div className="market-links"><a href="#product">Product</a><a href="#how">How it works</a><a href="#pricing">Pricing</a></div>
      <div className="market-actions"><Link className="link-button" href="/login">Log in</Link><Link className="solid-button" href="/signup">Start free <Icon name="arrow" size={15}/></Link></div>
    </nav>

    <section className="market-hero">
      <div className="hero-message">
        <span className="eyebrow"><i/> AI revenue operations for service businesses</span>
        <h1>Every lead gets an answer.<br/><em>Every next step gets done.</em></h1>
        <p>Recover handles calls, follow-up, booking, website and SEO issues, and revenue tracking from one calm workspace—without replacing the tools your team already uses.</p>
        <div className="hero-buttons"><Link className="solid-button large" href="/signup">Create your workspace <Icon name="arrow" size={16}/></Link><a className="outline-button large" href="#product">See what it does</a></div>
        <div className="hero-facts"><span><Icon name="check" size={14}/> 14-day software trial</span><span><Icon name="check" size={14}/> Safe test mode first</span><span><Icon name="check" size={14}/> Cancel anytime</span></div>
      </div>
      <ProductPreview />
    </section>

    <section className="outcome-bar"><span>Never miss the call</span><span>Follow up on time</span><span>Fill the calendar</span><span>Fix the conversion gaps</span><span>Know what paid</span></section>

    <section className="market-section capability-section" id="product">
      <div className="section-heading"><span>ONE SYSTEM, FEWER GAPS</span><h2>The work between “new lead” and “paid customer.”</h2><p>Choose the pieces you need. Recover coordinates them around the customer, with approval and failure states visible.</p></div>
      <div className="capability-grid">{capabilities.map(item=><article key={item.title}><div className="capability-top"><span>{item.tag}</span><i><Icon name={item.icon} size={20}/></i></div><h3>{item.title}</h3><p>{item.body}</p><Link href="/signup">Add to workspace <Icon name="arrow" size={14}/></Link></article>)}</div>
    </section>

    <section className="flow-section" id="how">
      <div><span>HOW RECOVER WORKS</span><h2>Connect what you use.<br/>Automate what you approve.</h2><p>Start in test mode. Every live action has a source, policy decision, provider response, and owner-visible outcome.</p><Link className="outline-button light" href="/signup">Build your first workflow <Icon name="arrow" size={15}/></Link></div>
      <ol><li><b>01</b><span><strong>Connect</strong><small>Phone, inbox, calendar, CRM, website, and payments.</small></span></li><li><b>02</b><span><strong>Choose a playbook</strong><small>Missed calls, lead follow-up, estimates, reviews, or reactivation.</small></span></li><li><b>03</b><span><strong>Test the edge cases</strong><small>Quiet hours, opt-outs, failures, transfers, and approvals.</small></span></li><li><b>04</b><span><strong>Turn it on</strong><small>Watch conversations, bookings, costs, and verified results.</small></span></li></ol>
    </section>

    <section className="market-section pricing-section" id="pricing">
      <div className="section-heading"><span>SIMPLE PRICING</span><h2>Start small. Add channels when they earn their place.</h2><p>Software plans exclude phone, SMS, email, and model usage. You see provider costs before anything goes live.</p></div>
      <div className="plan-grid">{plans.map(plan=><article key={plan.name} className={plan.featured?"featured":""}>{plan.featured&&<b className="plan-label">MOST POPULAR</b>}<span className="plan-name">{plan.name}</span><small>{plan.note}</small><div className="plan-price"><strong>{plan.price}</strong><span>/month</span></div><ul>{plan.features.map(feature=><li key={feature}><Icon name="check" size={14}/>{feature}</li>)}</ul><Link className={plan.featured?"solid-button full":"outline-button full"} href={`/signup?plan=${plan.name.toLowerCase()}`}>{plan.cta}<Icon name="arrow" size={15}/></Link></article>)}</div>
      <p className="price-note">No setup fee on Starter or Growth self-serve plans. Custom migrations and Scale integrations are quoted before work begins.</p>
    </section>

    <section className="closing-section"><span>YOUR NEXT LEAD IS ALREADY ON THE WAY</span><h2>Make sure the next step is ready.</h2><p>Create a workspace, connect nothing yet, and see exactly what Recover needs before any automation can run.</p><Link className="solid-button inverse large" href="/signup">Start free <Icon name="arrow" size={16}/></Link></section>
    <footer className="market-footer"><Brand/><p>Revenue operations for service businesses.</p><div><Link href="/login">Log in</Link><a href="#pricing">Pricing</a><a href="mailto:hello@recoverhq.com">Contact</a></div></footer>
  </main>;
}

function Brand(){return <Link className="market-brand" href="/"><span className="brand-symbol">R</span><strong>Recover</strong></Link>}

function ProductPreview(){return <div className="product-preview" aria-label="Example Recover workspace">
  <div className="preview-toolbar"><span><i/> Example workspace</span><b>TEST MODE</b></div>
  <div className="preview-body"><aside><b>R</b>{["grid","phone","calendar","scan","workflow","chart"].map((name,index)=><i className={index===0?"active":""} key={name}><Icon name={name as IconName} size={16}/></i>)}</aside><div className="preview-content"><div className="preview-title"><span><small>TODAY</small><strong>Good morning, Alex.</strong></span><button>Review 2 items</button></div><div className="preview-priority"><span><Icon name="phone" size={17}/></span><div><small>NEXT BEST ACTION</small><strong>Return a missed call</strong><p>New inquiry · received 4 minutes ago</p></div><b>Review →</b></div><div className="preview-columns"><article><small>CONVERSATIONS</small><div><i className="green"/><span><strong>New inquiry</strong><small>Call · needs response</small></span><b>Now</b></div><div><i className="amber"/><span><strong>Estimate question</strong><small>Email · waiting for team</small></span><b>18m</b></div></article><article><small>CONNECTED SYSTEMS</small><div><span><strong>Calendar</strong><small>No account connected</small></span><b>Connect</b></div><div><span><strong>Website monitor</strong><small>Ready for your URL</small></span><b>Set up</b></div></article></div><div className="preview-status"><span><Icon name="shield" size={14}/> Nothing sends until you approve it</span><span>0 live automations</span></div></div></div>
</div>}
