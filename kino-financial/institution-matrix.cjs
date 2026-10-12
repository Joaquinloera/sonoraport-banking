"use strict";
/**
 * SonoraPort banking matrix: research-to-integration state, not a transfer engine.
 * Input is a vetted list of institution records; never include credentials or account data.
 */
const VALID_STATES = new Set(["researched","docs_verified","sandbox_connected","production_approved"]);
function normalizeInstitution(row) {
  if (!row || typeof row !== "object") throw new TypeError("Institution record required");
  const name = String(row.company || row.name || "").trim();
  if (!name || name.length > 180) throw new Error("Invalid institution name");
  const category = String(row.category || "banking").slice(0, 80);
  const url = String(row.official_url || "");
  if (url && !/^https:\/\/[^\s]+$/i.test(url)) throw new Error("Official URL must use HTTPS");
  const state = row.integration_state || "researched";
  if (!VALID_STATES.has(state)) throw new Error("Invalid integration state");
  return Object.freeze({name, category, official_url:url, integration_state:state, live_transfers_enabled:false});
}
function buildMatrix(rows) {
  if (!Array.isArray(rows)) throw new TypeError("Expected institution array");
  const seen = new Set();
  return rows.map(normalizeInstitution).filter(record=>{
    const key=record.name.toLowerCase();
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
module.exports = {normalizeInstitution,buildMatrix};
