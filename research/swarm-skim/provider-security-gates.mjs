// SonoraPort provider security gates — research metadata only; no secrets or live transfers.
export const requiredWorkflow = Object.freeze(['RECOVER','AI AGENTS','SWARM','SKIM','CROSS-CHECK','CODE','TEST','SAVE','VERIFY']);
export const providers = Object.freeze({
  jpmorgan: {name:'JPMorgan Payments',documentation:'https://developer.payments.jpmorgan.com/api/authentication',authentication:['mTLS','OAuth signed JWT assertion','optional digital signature'],callback:'certificate and registered URL',production:false},
  bbva: {name:'BBVA API Market',documentation:'https://www.bbvaapimarket.com/en/banking-apis/',authentication:['product-specific; verify official onboarding'],production:false},
  bradesco: {name:'Bradesco Developers',documentation:'https://developers.bradesco.com.br/',authentication:['product-specific; verify official onboarding'],production:false},
  icbc: {name:'ICBC Asia OpenAPI',documentation:'https://www.icbcasia.com/hk/en/personal/internet-banking/open-api-developer-portal/default.html',authentication:['verify portal enrollment'],production:false},
  axis_upi: {name:'Axis Bank UPI',documentation:'https://apiportal.axis.bank.in/portal/product/36081',authentication:['verify partner eligibility'],production:false}
});
export function providerReadiness(provider, evidence = {}) {
  if (!provider || typeof provider !== 'object') throw new TypeError('provider required');
  const required = ['institutionApproval','verifiedCredentials','environmentConfigured','signedAuthorization','integrationTestsPassed'];
  const missing = required.filter(k => evidence[k] !== true);
  return {provider:provider.name,ready:missing.length===0,missing,liveTransfersEnabled:false};
}
export function safeProviderMetadata(provider) {
  const {name,documentation,authentication,callback} = provider;
  return {name,documentation,authentication,callback:callback??null};
}
