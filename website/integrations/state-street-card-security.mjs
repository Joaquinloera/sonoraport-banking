// Synthetic-only fraud signals; no PAN, PIN, CVV or magnetic stripe collection.
export function scoreSkimmingSignals(event){
 const allowed=['terminal_tamper_alert','unusual_fallback','reader_mismatch','velocity_anomaly'];
 if(Object.keys(event).some(k=>!allowed.includes(k)))throw Error('Unsupported field: do not submit payment credentials');
 return {score:allowed.reduce((n,k)=>n+(event[k]===true?25:0),0),flags:allowed.filter(k=>event[k]===true)};
}
