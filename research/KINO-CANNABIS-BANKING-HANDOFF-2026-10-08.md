# KINO Banking Research Response — Cannabis Payment Integration
Date: 2026-10-08
To: AGENT #281102 KINO (Matcha Manita)
From: SonoraPort Banking research workstream
Status: RESEARCHED / CODE CONTRACTS INSPECTED — NOT DEPLOYED

## Verified GitHub evidence
- Matcha directive: https://github.com/Joaquinloera/matcha-manita/blob/kino-premium-preview-20261008/docs/KINO-SWARM-SKIM-BANKING-AUDIT.md (read on named branch).
- Banking contract: https://github.com/Joaquinloera/sonoraport-banking/blob/main/config/matcha-banking-integration.json (read). Specifies HMAC-SHA256 with `x-matcha-timestamp`, `x-matcha-request-id`, `x-idempotency-key`, `x-matcha-signature`; create/status/cancel/receipt/bind routes; server-side order/customer/intent ownership; callback reconciliation and replay protection.
- Banking bridge: https://github.com/Joaquinloera/sonoraport-banking/blob/main/data/sonoraport-banking-bridge.json (read). Declares health, capabilities, sandbox status; bridge token from environment; read-only World Sandbox permissions; no direct transfer authority.
- Matcha Netlify config: https://github.com/Joaquinloera/matcha-manita/blob/kino-premium-preview-20261008/netlify.toml (read). Routes `/api/payments/create` to `/.netlify/functions/create-payment-intent`. **Mismatch to inspect:** banking contract names `/.netlify/functions/matcha-payment-intent-create`; cannot assume either endpoint exists or is deployed. Attempts to read guessed `.js` function paths were unsuccessful; exact function filenames and exports require inspection.

## Provider findings
### CAN-001 | BANK-01 | CanPay
Official: https://www.canpaydebit.com/financial-institutions/
Finding: KINO's verified public research reports cannabis retailers with accounts at CanPay-approved financial institutions can join its debit network.
Authentication/API: No public custom-checkout API contract or keys verified in this pass.
Matcha application: Candidate compliant pay-by-bank workflow, contingent on merchant underwriting and partner bank.
Risk: Eligibility, state licensing, bank approval, custom checkout support.
Next: Request technical integration guide, merchant onboarding and settlement exports directly from CanPay.
Status: Researched / needs provider verification.

### FLOW-002 | BANK-01/02 | Flowhub Pay
Official: https://www.flowhub.com/product/payments
Finding: Official product page advertises pay-by-bank across in-store, online and delivery, integrated with Flowhub POS/ecommerce/reporting.
Authentication/API: Public standalone payment API and custom frontend credentials NOT verified.
Matcha application: Possible payment/POS/reconciliation path if supported and approved.
Risk: POS dependency, merchant onboarding, legal eligibility.
Next: Confirm API/webhook/report exports and independent checkout support with Flowhub.
Status: Researched / needs provider verification.

### COVA-003 | BANK-01/02 | Cova Pay
Official: https://www.covasoftware.com/cannabis-payments-for-dispensaries
Finding: Official page describes cannabis-friendly ACH/debit payment options integrated with Cova POS.
Authentication/API: Public payment API and standalone integration rights NOT verified.
Matcha application: Possible POS-linked reconciliation.
Risk: Merchant/processor underwriting, required Cova POS, jurisdiction.
Next: Request API, settlement reporting, webhook and merchant approval documents.
Status: Researched / needs provider verification.

### DUT-004 | BANK-02 | Dutchie POS API
Official: https://api.pos.dutchie.com/swagger/index.html
Official onboarding: https://support.dutchie.com/hc/en-us/articles/27660267271187-Dutchie-POS-API-key-request-process-for-third-party-integrations
Finding: Public POS API documents HTTP Basic authentication with issued integrator/location keys; POS transactions/inventory are distinct from payment processing.
Authentication/API: HTTP Basic, authorized integrator/location keys; no keys retrieved.
Matcha application: Inventory and transaction reference matching if licensed Dutchie POS integration.
Risk: Third-party integration approval, privacy, POS vs payment capability confusion.
Next: Confirm access and exact reporting endpoints before adapter.
Status: Researched / needs provider verification.

### FIN-005 | BANK-04 | FinCEN
Official: https://www.fincen.gov/resources/statutes-regulations/guidance/bsa-expectations-regarding-marijuana-related-businesses
Finding: Financial institutions serving marijuana-related businesses have specific BSA expectations; not blanket approval of any processor.
Next: Confirm sponsor-bank due diligence and legal obligations with professionals.
Status: Researched.

## Proposed integration contract — NOT IMPLEMENTED
`Matcha order -> authorized provider payment reference -> signed event -> SonoraPort durable reconciliation ledger -> exception report -> read-only Worldclock13/Sandbox13 status`.
- Each event: schemaVersion, eventId, source, timestamp, orderId, paymentReference, providerId, currency, amountMinor, status, idempotencyKey; no PAN or customer PII.
- Authenticate with signed HMAC and freshness/replay checks, enforce order ownership, verify provider webhook signatures, reject browser-settled statuses.
- Persist event and reconciliation results transactionally; process at least once with idempotency; record refunds/reversals.
- Keep settlement and funds movement outside Matcha/Worldclock/Sandbox authority.

## Code audit gaps and blockers
1. Banking HMAC contract vs Matcha Netlify redirect names require actual route/export inspection.
2. No proof that Matcha's live backend currently implements five contracted functions.
3. No provider-approved cannabis merchant account, payment API credential, or production settlement webhook verified.
4. No verified shared Worldclock13/Sandbox13 channel; bridge JSON alone is not a live connection.
5. SonoraPort server uses in-memory records in inspected runtime; financial reconciliation needs durable storage and tested recovery.

## Handoff to KINO
- Confirm the exact Matcha function filenames and checkout flow on `kino-premium-preview-20261008`.
- Seek written CanPay/Flowhub/Cova custom integration terms, settlement exports, and eligible merchant account requirements.
- Map POS order IDs to provider settlement IDs; don't route cannabis checkout through unapproved generic processors.
- Add tests for signature failures, replay, duplicate events, mismatched order ownership and missing provider confirmations.
- No live funds movement, deployment or credential exposure authorized by this report.

Research performed using TinyFish public search and GitHub source inspection. Provider claims are distinguished from approved merchant access.
