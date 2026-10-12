'use strict';
const crypto = require('node:crypto');
const MAX_BYTES = 1024 * 1024;
/**
 * Framework-neutral, fail-closed webhook ingress guard.
 * Signature verification must be supplied by an independently audited
 * Cash App Pay verifier implementing the current official signing scheme.
 * No payment state is changed by this module.
 */
function createWebhookIngress({verifySignature, audit = () => {}, maxBytes = MAX_BYTES} = {}) {
  if (typeof verifySignature !== 'function') throw new Error('VERIFIER_REQUIRED');
  const seen = new Set();
  return async function receive({rawBody, headers = {}}) {
    if (!Buffer.isBuffer(rawBody)) throw new Error('RAW_BODY_REQUIRED');
    if (rawBody.length > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
    const normalized = Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase(),v]));
    if (!normalized['x-signature'] || !normalized['x-signed-headers']) throw new Error('SIGNATURE_HEADERS_REQUIRED');
    const valid = await verifySignature({rawBody, headers: normalized});
    if (valid !== true) throw new Error('INVALID_SIGNATURE');
    let event;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch { throw new Error('INVALID_JSON'); }
    if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('INVALID_EVENT');
    const digest = crypto.createHash('sha256').update(rawBody).digest('hex');
    if (seen.has(digest)) return {accepted:true, duplicate:true};
    seen.add(digest);
    audit({type:'CASH_APP_WEBHOOK_RECEIVED', digest, eventType:typeof event.type === 'string' ? event.type : 'UNKNOWN'});
    return {accepted:true, duplicate:false};
  };
}
module.exports = {createWebhookIngress};
