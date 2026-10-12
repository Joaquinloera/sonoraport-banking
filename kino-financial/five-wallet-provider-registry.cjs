'use strict';
const PROVIDERS=Object.freeze({
 cash_app_pay:{label:'Cash App Pay',mode:'PROCESSOR_OR_APPROVED_PARTNER',credentialNames:['processor_account','partner_client_id','partner_api_key'],docs:'https://developers.cash.app/cash-app-pay-partner-api/guides/partnerships/partner-with-cash-app-pay'},
 zelle:{label:'Zelle',mode:'BANK_PARTNER_ONLY',credentialNames:['bank_partner_agreement'],docs:'https://www.zellepay.com/faq/small-business-using-zelle'},
 venmo:{label:'Venmo',mode:'BRAINTREE_ELIGIBILITY_REQUIRED',credentialNames:['braintree_merchant_id','braintree_public_key','braintree_private_key'],docs:'https://developer.paypal.com/braintree/docs/guides/venmo/overview'},
 paypal:{label:'PayPal',mode:'REST_OAUTH',credentialNames:['paypal_client_id','paypal_client_secret'],docs:'https://developer.paypal.com/api/rest/'},
 apple_pay:{label:'Apple Pay',mode:'PROCESSOR_OR_MERCHANT_ID',credentialNames:['apple_merchant_id','payment_processor','domain_verification'],docs:'https://developer.apple.com/documentation/applepayontheweb/configuring-your-environment'}
});
const STATES=Object.freeze(['RESEARCHED','ACCESS_PENDING','SANDBOX_READY','TESTED','CONNECTED']);
function providerRecord(id,{state='RESEARCHED',authorizationReference=null,verifiedAt=null}={}){
 if(!Object.hasOwn(PROVIDERS,id))throw Error('Unknown payment provider');
 if(!STATES.includes(state))throw Error('Invalid state');
 if((state==='TESTED'||state==='CONNECTED')&&(!authorizationReference||!verifiedAt))throw Error('Verification evidence required');
 return Object.freeze({id,label:PROVIDERS[id].label,mode:PROVIDERS[id].mode,documentation:PROVIDERS[id].docs,requiredCredentialNames:[...PROVIDERS[id].credentialNames],state,authorizationReference,verifiedAt,liveTransactionsEnabled:false});
}
function createSimulationIntent({providerId,amountMinor,currency,reference}){
 if(!Object.hasOwn(PROVIDERS,providerId))throw Error('Unknown payment provider');
 if(!Number.isSafeInteger(amountMinor)||amountMinor<1||amountMinor>100000000)throw Error('Invalid amount');
 if(!/^[A-Z]{3}$/.test(currency))throw Error('Invalid currency');
 if(typeof reference!=='string'||!/^[-_a-zA-Z0-9]{1,80}$/.test(reference))throw Error('Invalid reference');
 return Object.freeze({providerId,amountMinor,currency,reference,mode:'SIMULATION_ONLY',status:'NOT_SUBMITTED',providerPaymentId:null});
}
function safeProviderSummary(record){return {id:record.id,label:record.label,state:record.state,mode:record.mode,documentation:record.documentation,liveTransactionsEnabled:false}}
module.exports={PROVIDERS,STATES,providerRecord,createSimulationIntent,safeProviderSummary};
