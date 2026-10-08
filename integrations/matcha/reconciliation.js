"use strict";

/**
 * Build 05 — pure reconciliation engine.
 * This is NOT an authentication boundary, ledger or payment processor.
 * Call only after independently authenticating provider messages and storing
 * immutable raw events in a durable transactional store.
 */
const TERMINAL = new Set(["settled", "refunded", "reversed", "failed"]);
const STATES = new Set(["pending", "authorized", ...TERMINAL]);
const ALLOWED = Object.freeze({
  pending: new Set(["pending", "authorized", "settled", "failed"]),
  authorized: new Set(["authorized", "settled", "failed"]),
  settled: new Set(["settled", "refunded", "reversed"]),
  refunded: new Set(["refunded"]),
  reversed: new Set(["reversed"]),
  failed: new Set(["failed"])
});
function validate(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("record required");
  for (const key of ["eventId", "orderId", "paymentReference", "providerId", "currency", "status"]) {
    if (typeof record[key] !== "string" || !record[key].trim()) throw new TypeError("invalid " + key);
  }
  if (!/^[A-Z]{3}$/.test(record.currency)) throw new TypeError("invalid currency");
  if (!Number.isSafeInteger(record.amountMinor) || record.amountMinor < 0) throw new TypeError("invalid amountMinor");
  if (!STATES.has(record.status)) throw new TypeError("invalid status");
  if (["settled", "refunded", "reversed"].includes(record.status) && record.providerVerified !== true) {
    throw new Error("settlement requires verified provider evidence");
  }
  return Object.freeze({
    eventId:record.eventId,orderId:record.orderId,paymentReference:record.paymentReference,
    providerId:record.providerId,currency:record.currency,amountMinor:record.amountMinor,
    status:record.status,providerVerified:record.providerVerified === true
  });
}
function sameEvent(a,b) {
  return Object.keys(a).every(key=>a[key]===b[key]);
}
function reconcile(records) {
  if (!Array.isArray(records)) throw new TypeError("records must be array");
  const events = new Map(), orders = new Map(), exceptions = [];
  for (const raw of records) {
    const e = validate(raw);
    const duplicate = events.get(e.eventId);
    if (duplicate) {
      if (!sameEvent(duplicate,e)) exceptions.push({orderId:e.orderId,reason:"duplicate_event_id_conflict",eventId:e.eventId});
      continue;
    }
    events.set(e.eventId,e);
    const prior = orders.get(e.orderId);
    if (prior && (prior.currency !== e.currency || prior.amountMinor !== e.amountMinor || prior.paymentReference !== e.paymentReference || prior.providerId !== e.providerId)) {
      exceptions.push({orderId:e.orderId,reason:"payment_reference_or_amount_mismatch",eventId:e.eventId});
      continue;
    }
    if (prior && !ALLOWED[prior.status].has(e.status)) {
      exceptions.push({orderId:e.orderId,reason:TERMINAL.has(prior.status)?"terminal_status_conflict":"invalid_status_transition",eventId:e.eventId});
      continue;
    }
    orders.set(e.orderId,e);
  }
  return {processedEventCount:events.size,orders:[...orders.values()],exceptions};
}
module.exports = {validate,reconcile};
