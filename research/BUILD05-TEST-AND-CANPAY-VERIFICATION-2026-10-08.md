# Build 05 — SWARM + SKIM Verification Report
Date: 2026-10-08
Workstream: BANK-02 / BANK-03 / BANK-05
Status: TESTED LOCALLY (synthetic only); NOT DEPLOYED

## Test execution evidence
Retrieved exact GitHub source of `integrations/matcha/reconciliation.js` (blob SHA `ab24613d6d615447887d7e49fc4bfd4131cbdbc9`) and `integrations/matcha/reconciliation.test.js` (blob SHA `21a9b4f923784783e60baab89998b606b673dd38`), recreated them locally, and ran `node --test reconciliation.test.js` with Node v22.16.0.
Result: **5 tests passed, 0 failed, 0 skipped** (approximately 61 ms). This is a local test run, not a GitHub Actions CI run or deployed integration test.

Coverage: duplicate event IDs, unverified settlement rejection, conflicting order/payment reference detection, terminal rollback rejection, invalid amount rejection.

## Research finding CAN-006
**Agent / Workstream:** BANK-01 / BANK-02
**Company or System:** CanPay
**Official Source:** https://www.canpaydebit.com/financial-institutions/
**Verified Findings:** CanPay says financial institutions with compliant banking programs partner to offer payment solutions to cannabis retailers. A public page does not establish SonoraPort or Matcha merchant acceptance.
**API / Authentication:** Public custom API authentication not verified.
**Potential Matcha Manita Application:** Candidate cannabis-specific pay-by-bank network subject to written onboarding and technical approval.
**Security or Compliance Risks:** Merchant eligibility, financial institution onboarding, reconciliation records, authorized checkout flow.
**Recommended Next Action:** Obtain technical integration documentation, settlement exports, webhook format, and explicit merchant eligibility from CanPay.
**Status:** Researched; needs verification.

## Matcha route inspection
The named branch `kino-premium-preview-20261008` has `netlify.toml` redirecting `/api/payments/create` to `/.netlify/functions/create-payment-intent`. Attempt to fetch `netlify/functions/create-payment-intent.mjs` on that branch returned 404. Earlier `.js` guesses also returned 404. This **does not prove the endpoint is absent**: exact path, branch tree, and function bundling need inspection.

## Remaining engineering gates
- No persistent transaction/event store or provider-authenticated webhook ingestion yet.
- Synthetic tests do not prove legitimate merchant approval or production settlement.
- ProviderVerified is a caller-supplied boolean in current pure module; it MUST NOT be trusted from browser or unverified external payload. Enforce provider webhook signature/credential checks at the trusted ingestion boundary.
- Duplicate event IDs with conflicting payloads and valid status-transition policies need additional coverage.
- Worldclock13/Sandbox13 connection remains unverified.

No money movement, live checkout activation, or production deployment occurred.
