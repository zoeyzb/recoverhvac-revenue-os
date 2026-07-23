"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import "./get-started.css";
import "./enhancements.css";

const needs = ["Missed calls", "Slow lead response", "Unfollowed estimates", "Weak website", "Poor local visibility", "Too few reviews", "No revenue attribution", "Complete system"];
const services = [
  { id: "audit", title: "Audit only", body: "Website, local conversion, SEO, missed-demand and follow-up gaps." },
  { id: "front-office", title: "AI front office", body: "Phone, SMS, inbox, booking and approved follow-up managed for you." },
  { id: "complete", title: "Complete recovery", body: "Front office plus website, SEO, reviews, attribution and ongoing optimization." },
];

export default function GetStartedPage(){
  const [step,setStep]=useState(1); const [busy,setBusy]=useState(false); const [done,setDone]=useState(false); const [error,setError]=useState("");
  const [form,setForm]=useState({name:"",businessName:"",phone:"",email:"",industry:"",city:"",websiteUrl:"",noWebsite:false,needs:[] as string[],service:"complete",notes:""});
  const selected=useMemo(()=>services.find(item=>item.id===form.service)!,[form.service]);
  function field(name:string,value:unknown){setForm(current=>({...current,[name]:value}));}
  function toggleNeed(value:string){setForm(current=>({...current,needs:current.needs.includes(value)?current.needs.filter(item=>item!==value):[...current.needs,value]}));}
  function continueToNextStep(){
    setError("");
    if(step===1){
      if(!form.name.trim()||!form.businessName.trim()||!form.phone.trim()||!form.email.trim()||!form.industry.trim()||!form.city.trim()){
        setError("Complete the business basics before continuing.");
        return;
      }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())){
        setError("Enter a valid email address.");
        return;
      }
      if(!form.noWebsite&&!form.websiteUrl.trim()){
        setError("Enter your website URL or choose “I do not have a website.”");
        return;
      }
      if(!form.noWebsite){
        try{
          const url=new URL(form.websiteUrl);
          if(!["http:","https:"].includes(url.protocol))throw new Error();
        }catch{
          setError("Enter a valid website URL.");
          return;
        }
      }
    }
    if(step===2&&form.needs.length===0){
      setError("Choose at least one revenue leak.");
      return;
    }
    setStep(value=>value+1);
  }
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/intake",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||"Could not submit your request");setDone(true);}catch(value){setError(value instanceof Error?value.message:"Could not submit your request");}finally{setBusy(false);}}
  if(done)return <main className="intake-page"><div className="intake-success"><span><Icon name="check" size={22}/></span><small>REQUEST RECEIVED</small><h1>Your recovery plan is queued.</h1><p>Recover now has the business context, selected service and problems to investigate. Nothing has been connected or sent yet.</p><div><Link href="/signup" className="intake-primary">Create your secure client portal</Link><Link href="/" className="intake-secondary">Back to website</Link></div></div></main>;
  return <main className="intake-page">
    <header><Link href="/" className="intake-brand"><span>R</span><strong>Recover</strong></Link><div>Step {step} of 3</div></header>
    <div className="intake-layout">
      <aside><small>START WITH THE LEAK</small><h1>Show us where revenue slips away.</h1><p>We can begin the audit the same day. Answer a few business questions, choose what needs recovery, and we will prepare the scope and launch plan.</p><ol><li className={step>=1?"active":""}>Business basics</li><li className={step>=2?"active":""}>Where revenue leaks</li><li className={step>=3?"active":""}>Choose the service</li></ol><div className="intake-trust"><Icon name="shield" size={16}/><span>Nothing connects or contacts a customer from this form. You review the plan first.</span></div><Link className="intake-owner-entry" href="/owner/login">Recover owner? Open the private owner login →</Link></aside>
      <form onSubmit={submit}>
        {step===1&&<section><small>BUSINESS BASICS</small><h2>Who are we building this for?</h2><div className="intake-grid"><label><span>Your name</span><input required name="name" value={form.name} onChange={e=>field("name",e.target.value)}/></label><label><span>Business name</span><input required name="businessName" value={form.businessName} onChange={e=>field("businessName",e.target.value)}/></label><label><span>Phone</span><input required name="phone" inputMode="tel" value={form.phone} onChange={e=>field("phone",e.target.value)}/></label><label><span>Email</span><input required type="email" name="email" value={form.email} onChange={e=>field("email",e.target.value)}/></label><label><span>Business type</span><input required name="industry" placeholder="HVAC, plumbing, dental, legal..." value={form.industry} onChange={e=>field("industry",e.target.value)}/></label><label><span>City or service area</span><input required name="city" value={form.city} onChange={e=>field("city",e.target.value)}/></label><label className="wide"><span>Website URL</span><input name="websiteUrl" type="url" disabled={form.noWebsite} placeholder="https://yourbusiness.com" value={form.websiteUrl} onChange={e=>field("websiteUrl",e.target.value)}/></label><label className="check wide"><input type="checkbox" checked={form.noWebsite} onChange={e=>field("noWebsite",e.target.checked)}/><span>I do not have a website — include website help.</span></label></div></section>}
        {step===2&&<section><small>OPPORTUNITY GAPS</small><h2>What is costing the business money?</h2><p className="section-copy">Choose everything that applies. Recover will investigate the evidence before recommending outreach or automation.</p><div className="choice-grid">{needs.map(item=><button type="button" key={item} className={form.needs.includes(item)?"selected":""} onClick={()=>toggleNeed(item)}><span>{item}</span>{form.needs.includes(item)&&<Icon name="check" size={15}/>}</button>)}</div><label className="notes"><span>Anything else we should know?</span><textarea value={form.notes} onChange={e=>field("notes",e.target.value)} placeholder="Current problems, software you use, busiest hours, goals..."/></label></section>}
        {step===3&&<section><small>SERVICE PATH</small><h2>How much should Recover handle?</h2><div className="service-list">{services.map(item=><button type="button" key={item.id} className={form.service===item.id?"selected":""} onClick={()=>field("service",item.id)}><span><strong>{item.title}</strong><small>{item.body}</small></span><i>{form.service===item.id?"Selected":"Choose"}</i></button>)}</div><div className="summary"><span>Selected</span><strong>{selected.title}</strong><p>Scope, provider costs, launch requirements and ongoing pricing are confirmed before anything is connected.</p></div></section>}
        {error&&<div className="intake-error" role="alert"><span>{error}</span>{step===3&&<a href="mailto:hello@recoverhq.com">Email us instead</a>}</div>}
        <footer>{step>1?<button type="button" className="back" onClick={()=>{setError("");setStep(value=>value-1)}}>Back</button>:<Link href="/" className="back">Cancel</Link>}{step<3?<button type="button" className="next" onClick={continueToNextStep}>Continue <Icon name="arrow" size={15}/></button>:<button className="next" disabled={busy}>{busy?"Submitting…":"Request my recovery plan"}<Icon name="arrow" size={15}/></button>}</footer>
      </form>
    </div>
  </main>;
}
