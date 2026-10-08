"use strict";

/**
 * Build 05: pure, provider-neutral reconciliation for synthetic or authorized
 * provider-confirmed records. Does not call a payment provider or move funds.
 * Use persistent storage + authenticated webhook verification before production.
 */
const TERMINAL = new Set(["settled", "refunded", "reversed", "failed"]);
const STATES = new Set(["pending", "authorized", ...TERMINAL]);
function validate(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("record required");
  for (const key of ["eventId", "orderId", "paymentReference", "providerId", "currency", "status"]) {
    if (typeof record[key] !== "string" || !record[key].trim()) throw new TypeError("invalid " + key);
  }
  if (!/^[A-Z]{3}$/.test(record.currency)) throw new TypeError("invalid currency");
  if (!Number.isSafeInteger(record.amountMinor) || record.amountMinor < 0) throw new TypeError("invalid amountMinor");
  if (!STATES.has(record.status)) throw new TypeError("invalid status");
  if (record.status === "settled" && record.providerVerified !== true) throw new Error("settlement requires verified provider evidence");
  return Object.freeze({eventId:record.eventId,orderId:record.orderId,paymentReference:record.paymentReference,providerId:record.providerId,currency:record.currency,amountMinor:record.amountMinor,status:record.status,providerVerified:record.providerVerified === true});
}
function reconcile(records) {
  if (!Array.isArray(records)) throw new TypeError("records must be array");
  const events = new Set(), orders = new Map(), exceptions = [];
  for (const raw of records) {
    const e = validate(raw);
    if (events.has(e.eventId)) continue;
    events.add(e.eventId);
    const prior = orders.get(e.orderId);
    if (prior && (prior.currency !== e.currency || prior.amountMinor !== e.amountMinor || prior.paymentReference !== e.paymentReference || prior.providerId !== e.providerId)) {
      exceptions.push({orderId:e.orderId,reason:"payment_reference_or_amount_mismatch",eventId:e.eventId});continue;
    }
    if (prior && TERMINAL.has(prior.status) && prior.status !== e.status) {
      exceptions.push({orderId:e.orderId,reason:"terminal_status_conflict",eventId:e.eventId});continue;
    }
    orders.set(e.orderId,e);
  }
  return {processedEventCount:events.size,orders:[...orders.values()],exceptions};
}
module.exports = {validate,reconcile};
