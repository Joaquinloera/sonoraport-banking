"use strict";
const providers = Object.freeze({
 stripe: Object.freeze({region:"global",category:"merchant-payments",documentation:"https://docs.stripe.com/api/authentication",auth:"server-side-secret-api-key",access:"approved-account",operations:["payment-intents","webhooks"],productionConnected:false}),
 paypal: Object.freeze({region:"global",category:"merchant-payments",documentation:"https://developer.paypal.com/api/rest/authentication/",auth:"oauth2-client-credentials",access:"approved-account",operations:["orders","webhooks"],productionConnected:false}),
 pix: Object.freeze({region:"BR",category:"payment-rail",documentation:"https://www.bcb.gov.br/en/financialstability/pixparticipants",auth:"institutional-participant",access:"direct-or-indirect-participation",operations:["participant-onboarding"],productionConnected:false})
});
function plan(provider, operation) {
 if(typeof provider!=="string" || !Object.hasOwn(providers,provider)) throw new Error("UNKNOWN_PROVIDER");
 const p=providers[provider];
 if(!p.operations.includes(operation)) throw new Error("UNSUPPORTED_OPERATION");
 return Object.freeze({provider,operation,mode:"DOCUMENTATION_ONLY",requiresAuthorization:true,execute:false,documentation:p.documentation});
}
module.exports={providers,plan};
