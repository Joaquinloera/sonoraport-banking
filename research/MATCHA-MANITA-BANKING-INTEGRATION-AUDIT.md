# SonoraPort ↔ Matcha Manita — Banking Integration Audit
Research date: 2026-10-08
Owner: SonoraPort Banking / AGENT #281102 KINO
Status: RESEARCHED — integration not verified or deployed

## System boundary
- **Matcha Manita:** owns customer-facing catalog, orders, customer consent and business eligibility decisions.
- **SonoraPort Banking:** owns financial integration adapters, normalized settlement records, reconciliation, exception queues and audit records. It must not represent itself as a bank without independent charter verification.
- **Worldclock13:** proposed scheduling/time coordination; actual code connection NOT VERIFIED.
- **Sandbox13:** proposed isolated simulation/monitoring; actual code connection NOT VERIFIED.
- **Cross-project synchronization:** NOT VERIFIED. No shared communication channel or service authorization established.

## Code audit — verified from GitHub
- `server.js` is a Node HTTP backend, imports `paypal-production-adapter.js` and `production-rail-runtime.js`, and currently uses in-memory Maps for payment intents, idempotency and audit receipts. In-memory state is unsuitable as durable financial recordkeeping.
- `production-payment-rails.json` declares production rail configurations for Visa, Mastercard, PayPal, Venmo, Zelle and JPMorgan Chase; some are marked enabled while awaiting provider verification or partner provisioning. Enabled is NOT authenticated.
- `production-rail-runtime.js` checks environment variable presence and explicitly returns `authenticated:false`, `providerVerified:false`, `settlementVerified:false`; multiple rail adapters are null.
- `paypal-production-adapter.js` implements live OAuth and PayPal order API calls; **do not activate it for Matcha Manita cannabis commerce absent written provider approval**.
- `package.json` test command is only `node --check server.js`; this is a syntax check, not an integration test.

## Findings (directive report format)

### BANK-01 — FIN-001
**Agent / Workstream:** BANK-01 Banking Research
**Company or System:** FinCEN marijuana-related business guidance
**Official Source:** https://www.fincen.gov/resources/statutes-regulations/guidance/bsa-expectations-regarding-marijuana-related-businesses
**Verified Findings:** FinCEN publishes specific BSA expectations for financial institutions serving marijuana-related businesses; this does not grant a bank partnership or authorize a processor.
**API / Authentication:** Not an API.
**Potential Matcha Manita Application:** Define bank onboarding evidence, beneficial-ownership documentation and transaction-monitoring review requirements with qualified counsel and the sponsoring institution.
**Security or Compliance Risks:** Federal/state cannabis law, BSA/AML, suspicious activity reporting, licensing, and provider contractual eligibility.
**Recommended Next Action:** Obtain legal and bank-partner eligibility review before any live cannabis payment integration.
**Status:** Researched; applicability needs verification.

### BANK-02 — FIN-002
**Agent / Workstream:** BANK-02 API Research
**Company or System:** Stripe
**Official Source:** https://stripe.com/legal/restricted-businesses
**Verified Findings:** Stripe's restricted-businesses policy identifies cannabis dispensaries and related businesses; do not assume support.
**API / Authentication:** Stripe secret API keys are server-side; not inspected or obtained.
**Potential Matcha Manita Application:** None for cannabis checkout without explicit written eligibility approval.
**Security or Compliance Risks:** Account termination, held funds, processing-policy violations.
**Recommended Next Action:** Mark Stripe cannabis payment acceptance BLOCKED pending documented approval.
**Status:** Researched; not integrated.

### BANK-02 — FIN-003
**Agent / Workstream:** BANK-02 API Research
**Company or System:** PayPal
**Official Source:** https://developer.paypal.com/api/rest/production ; https://developer.paypal.com/api/rest/requests ; https://www.paypal.com/us/legalhub/acceptableuse-full
**Verified Findings:** Live REST API uses OAuth 2.0 client credentials; technical support for live OAuth does not establish cannabis merchant eligibility.
**API / Authentication:** Live client ID and secret exchanged server-side for access token.
**Potential Matcha Manita Application:** Only if provider confirms the precise business and transaction types in writing.
**Security or Compliance Risks:** Prohibited activity, unapproved merchant category, live money movement.
**Recommended Next Action:** Disable Matcha Manita routing through PayPal until explicit eligibility verification.
**Status:** Researched; technical adapter exists in SonoraPort; Matcha eligibility unverified.

### BANK-03 — FIN-004
**Agent / Workstream:** BANK-03 Software Architecture
**Company or System:** SonoraPort internal ledger and reconciliation
**Official Source:** https://github.com/Joaquinloera/sonoraport-banking/blob/main/server.js
**Verified Findings:** Payment intents, idempotency and audit receipts currently use process-memory Maps. No durable financial ledger verified in inspected code.
**API / Authentication:** Proposed service-to-service authenticated API with scoped tokens, signature verification, timestamp freshness and replay protection.
**Potential Matcha Manita Application:** Match each eligible order to authorized processor events and settlement batches.
**Security or Compliance Risks:** Lost records on restart, duplicate posting, data leakage and unmatched settlements.
**Recommended Next Action:** Build durable append-only event storage and reconciliation tests before production integration.
**Status:** Code inspected; implementation proposed.

### BANK-04 — FIN-005
**Agent / Workstream:** BANK-04 Compliance and Security
**Company or System:** SonoraPort production rail runtime
**Official Source:** https://github.com/Joaquinloera/sonoraport-banking/blob/main/production-rail-runtime.js
**Verified Findings:** Runtime reports authentication and settlement verification as false; declared production rail does not mean connected.
**API / Authentication:** Server-side env variable names for several providers, no secret values inspected.
**Potential Matcha Manita Application:** Fail-closed provider readiness gate.
**Security or Compliance Risks:** False 'enabled' interpretation; production action before eligibility and provider verification.
**Recommended Next Action:** Require documented authorization + actual read-only authentication + approved merchant use case before activation.
**Status:** Inspected.

### BANK-05 — FIN-006
**Agent / Workstream:** BANK-05 Matcha Manita Coordination
**Company or System:** Matcha Manita / Worldclock13 / Sandbox13
**Official Source:** No verified repository or deployed code source established in this audit.
**Verified Findings:** Names and intended roles supplied by project directive; implementation and shared credentials NOT VERIFIED.
**API / Authentication:** Proposed least-privilege service credentials and signed webhooks.
**Potential Matcha Manita Application:** Commerce event -> reconciliation record -> scheduled exception report.
**Security or Compliance Risks:** Unverified service identity, cross-tenant access, cannabis payment restrictions.
**Recommended Next Action:** Identify the actual Matcha Manita repository and API contracts, then perform read-only architecture comparison.
**Status:** Needs Verification.

## Proposed versioned event contract (not implemented)
```json
{
  "schema_version": "1.0",
  "event_id": "evt_synthetic_001",
  "event_type": "order.payment_status_changed",
  "source_system": "matcha-manita",
  "occurred_at": "2026-10-08T00:00:00Z",
  "order_reference": "order_synthetic_001",
  "payment_reference": "pay_synthetic_001",
  "currency": "USD",
  "amount_minor": 2500,
  "status": "pending",
  "provider": "unverified"
}
```
No card PAN, bank account numbers, secrets, customer identity or product detail should be included in this event. Authenticate the sender; reject replayed event IDs; reconcile only provider-confirmed statuses. Statuses are **pending**, **authorized**, **settled**, **refunded**, **reversed**, **failed**; only verified provider settlement evidence may yield settled. These are proposed contract values, not live observations.

## Implementation gates
1. Confirm actual Matcha Manita code ownership, repository, merchant legal entity, product types, jurisdiction and licensing.
2. Confirm bank/payment provider **written cannabis eligibility** and production onboarding.
3. Create isolated credentials and least-privilege service permissions; no secrets in GitHub or frontend.
4. Build persistent ledger, idempotent event ingestion, signed webhooks, exception queue and audit tests.
5. Verify end-to-end reconciliation against authorized provider statements; keep transfers disabled until separately approved.
6. Confirm Netlify deployment source for sonoraportaiholdingllc.com before claiming website updates.

## Open blockers
- No verified Matcha Manita backend or integration endpoint.
- No independently confirmed cannabis-eligible banking/processing partner.
- No durable ledger or complete reconciliation integration tests verified.
- No live cross-project sync, no deployed integration and no money movement performed.
