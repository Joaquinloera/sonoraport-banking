'use strict';
/** Provider readiness policy. Metadata only: never initiates transfers. */
const PROVIDERS = Object.freeze({
  jpmorganChase: Object.freeze({region:'US',auth:'oauth2-signed-jwt-mtls',documentation:'https://developer.payments.jpmorgan.com/api/authentication',requires:['bankProvisioned','certificatesConfigured','providerVerified']}),
  pix: Object.freeze({region:'BR',auth:'institution-specific',documentation:'https://github.com/bacen/pix-api',requires:['institutionProvisioned','providerVerified']}),
  fireblocks: Object.freeze({region:'global',auth:'signed-webhook-jwks',documentation:'https://developers.fireblocks.com/reference/validating-webhooks',requires:['workspaceProvisioned','webhookSignatureVerified']})
});
function readiness(providerId, evidence = {}) {
  if (!Object.hasOwn(PROVIDERS,providerId)) return {providerId,status:'unknown-provider',ready:false,missing:[]};
  const missing=PROVIDERS[providerId].requires.filter(k=>evidence[k]!==true);
  return {providerId,status:missing.length?'blocked':'eligible-for-further-verification',ready:false,missing};
}
module.exports={PROVIDERS,readiness};
