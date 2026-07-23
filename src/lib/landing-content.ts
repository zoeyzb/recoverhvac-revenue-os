import type { IconName } from "@/components/icon";

export type Walkthrough = {
  id: string;
  label: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  signal: string;
  action: string;
  result: string;
  approval: string;
};

export const walkthroughs: Walkthrough[] = [
  {
    id: "missed-call",
    label: "Missed call",
    icon: "phone",
    eyebrow: "INBOUND · AFTER HOURS",
    title: "Missed call. Recovered opportunity.",
    body: "Recover responds on the approved channel, understands what the caller needs, checks urgency, and offers real availability.",
    signal: "New caller · no answer",
    action: "Respond, qualify, and check availability",
    result: "Customer gets a next step",
    approval: "Transfers and sensitive replies follow your policy.",
  },
  {
    id: "quiet-estimate",
    label: "Quiet estimate",
    icon: "refresh",
    eyebrow: "FOLLOW-UP · APPROVED CADENCE",
    title: "No reply does not mean no sale.",
    body: "Recover follows up on the cadence you approve, stops the moment the customer replies, and returns the conversation to your team.",
    signal: "Estimate sent · no reply",
    action: "Run the approved follow-up sequence",
    result: "Reply returned to your team",
    approval: "Cadence, tone, and stop rules are confirmed before launch.",
  },
  {
    id: "website-leak",
    label: "Website leak",
    icon: "scan",
    eyebrow: "WEBSITE · CONVERSION MONITOR",
    title: "Find where the website loses the customer.",
    body: "Recover checks the path from search to contact, records the failure, and ranks the highest-impact fix—without hiding behind a generic SEO score.",
    signal: "Form or booking path fails",
    action: "Capture evidence and rank the leak",
    result: "Fix prepared for review",
    approval: "No website change is published without authorization.",
  },
];

export type Plan = {
  id: string;
  name: string;
  note: string;
  price: string;
  period: string;
  fit: string;
  features: string[];
  disclosure: string;
};

export const plans: Plan[] = [
  {
    id: "audit",
    name: "Recovery Audit",
    note: "Find the leaks",
    price: "$297",
    period: "one time",
    fit: "Best when you need evidence and priorities before changing systems.",
    features: [
      "Website and local-conversion audit",
      "Missed-opportunity map",
      "Evidence-backed action plan",
    ],
    disclosure: "No external action is run.",
  },
  {
    id: "front-office",
    name: "Front Office",
    note: "Stop losing demand",
    price: "$997",
    period: "per month",
    fit: "Best for teams losing calls, leads, estimates, or booking opportunities.",
    features: [
      "AI phone, text, and follow-up",
      "Calendar and inbox connection",
      "Managed launch and monitoring",
    ],
    disclosure: "Provider usage and one-time setup are scoped separately.",
  },
  {
    id: "complete-recovery",
    name: "Complete Recovery",
    note: "Operate the full system",
    price: "$1,997",
    period: "per month",
    fit: "Best when front office, website, reviews, and attribution need one owner.",
    features: [
      "Everything in Front Office",
      "Website, SEO, reviews, and attribution",
      "Ongoing optimization and reporting",
    ],
    disclosure: "Provider usage and one-time setup are scoped separately.",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  company: string;
  verified: boolean;
  source?: string;
};

export const testimonials: Testimonial[] = [
  {
    quote: "Reserved for a customer-approved quote with a verifiable source.",
    name: "Awaiting customer permission",
    company: "Not published",
    verified: false,
  },
];

export const publishedTestimonials = testimonials.filter(
  (testimonial) => testimonial.verified && Boolean(testimonial.source),
);

export const faqs = [
  {
    question: "Does Recover replace my team?",
    answer:
      "It can replace selected repetitive front-office work, or work beside your team—the choice is yours. Use Recover for after-hours coverage, overflow, follow-up, booking, or the full routine workflow while your people keep control of exceptions and important customer decisions.",
  },
  {
    question: "Can I keep my current phone number and calendar?",
    answer:
      "Usually, yes. Recover is designed to connect to the systems you already use. The exact routing and calendar setup are confirmed during intake before anything launches.",
  },
  {
    question: "Will AI send messages or change my website without approval?",
    answer:
      "Only within the policy you approve. Sensitive replies, transfers, new campaigns, and website changes can be held for review. The dashboard shows what is waiting and why.",
  },
  {
    question: "What counts as recovered revenue?",
    answer:
      "Recover connects the originating conversation to a verified booking or payment event. Unverified estimates and vanity metrics are not presented as revenue.",
  },
  {
    question: "Are software and phone costs included?",
    answer:
      "The service price covers Recover's managed work. One-time setup and provider usage—such as phone, email, model, or payment fees—are scoped before launch.",
  },
  {
    question: "How quickly can we launch?",
    answer:
      "We can start the audit the same day. You receive the findings, recommended scope, and launch plan before anything connects. A focused workflow can often launch in days; broader phone, calendar, website, and revenue setups depend on access and approvals.",
  },
] as const;

export function getWalkthrough(id: string) {
  return walkthroughs.find((item) => item.id === id) ?? walkthroughs[0];
}

export function getPlan(id: string) {
  return plans.find((item) => item.id === id) ?? plans[1];
}
