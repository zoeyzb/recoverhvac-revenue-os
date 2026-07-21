export const initialJourney=()=>({stage:"missed",contactable:false,consent:false,conversation:[],appointment:null,payment:null,ledger:[]});
export function advance(state,event){
  if(event.type==="missed_call")return{...state,stage:"policy_review",conversation:[...state.conversation,event]};
  if(event.type==="consent_verified")return{...state,contactable:true,consent:true,stage:"follow_up_ready"};
  if(event.type==="reply"){if(!state.consent)throw new Error("CONSENT_REQUIRED");return{...state,stage:"qualified",conversation:[...state.conversation,event]};}
  if(event.type==="booked")return{...state,stage:"booked",appointment:{id:event.id,starts_at:event.starts_at}};
  if(event.type==="paid"){if(!state.appointment)throw new Error("BOOKING_EVIDENCE_REQUIRED");return{...state,stage:"paid",payment:{id:event.id,amount_minor:event.amount_minor},ledger:[...state.ledger,{entry_type:"revenue",amount_minor:event.amount_minor,payment_id:event.id,evidence:{provider_event_id:event.provider_event_id}}]};}
  throw new Error("UNKNOWN_EVENT");
}
