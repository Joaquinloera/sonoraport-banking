# Banking Agent — KINO #281102 SWARM + SKIM handoff
Date: 2026-10-08
From: Matcha Manita / KINO #281102
To: Sonoraport Banking research and integration agent

## User directive
Continue SWARM + SKIM research and coordinate Matcha Manita, Sonoraport Banking, Worldsanbox13, and Worldclock13. Research real banking and payment options, not unsupported assumptions or opinions. Do not treat ordinary payment APIs as automatically compatible; equally, do not presume all cannabis banking/payment solutions are unavailable. Verify each actual provider's documented capabilities and onboarding terms.

## Verified project evidence
- This repository: `config/matcha-banking-integration.json` defines server-to-server HMAC-SHA256 signing, replay protection, idempotency, payment-intent routes, ownership checks, and callback reconciliation.
- `data/sonoraport-banking-bridge.json` defines authenticated bridge health and capabilities endpoints with environment-based URL/token.
- `Joaquinloera/Worldsanbox13`: `data/sonoraport-banking-bridge.json` reports `connectionState.configured=false` until deployment secrets are supplied.
- `Joaquinloera/matcha-manita`: `netlify.toml` declares Netlify Functions and payment-create routing. Runtime parity has not yet been tested.
- KINO research file: https://github.com/Joaquinloera/matcha-manita/blob/kino-premium-preview-20261008/docs/KINO-SWARM-SKIM-BANKING-AUDIT.md

## SWARM research assignments
BANK-01: Compare CanPay, Flowhub Pay, Cova Pay and additional verified cannabis-specific banking/payment providers. Record onboarding, jurisdiction, fees, settlement, account prerequisites, merchant eligibility and evidence.
BANK-02: Locate official APIs, sandbox documentation, webhooks, authentication, integration permissions and reconciliation/export endpoints. Mark undocumented APIs as unknown.
BANK-03: Compare payment-intent contract with Matcha Manita's deployed and repository functions. Identify actual mismatches before coding.
BANK-04: Test-only threat modeling for signed requests, timestamp/replay defense, idempotency, duplicate provider callbacks, ownership, secrets and audit logs.
BANK-05: Specify shared non-sensitive status/event schema for Worldsanbox13 and Worldclock13; no money-movement authority for monitoring components.

## Primary-source starting points
- CanPay: https://www.canpaydebit.com/financial-institutions/
- Flowhub payments: https://www.flowhub.com/product/payments
- Cova payments: https://www.covasoftware.com/cannabis-payments-for-dispensaries
- Dutchie POS API: https://api.pos.dutchie.com/swagger/index.html
- FinCEN MRB guidance: https://www.fincen.gov/resources/statutes-regulations/guidance/bsa-expectations-regarding-marijuana-related-businesses

## SKIM evidence format
Provider / official URL / exact documented feature / API authentication / eligibility or integration requirements / date checked / verified vs proposed vs untested / next experiment.

## Coordination and safeguards
Use GitHub as the shared research record; a file commit is not a live message to a separately running agent. Do not claim agents are actively connected without verifying a communication channel. Do not place secrets in GitHub. No production changes, account access, fund movement or real payment execution without separate explicit authorization. Use synthetic test fixtures first.

## Deliverables
1. Sourced provider comparison.
2. Matcha Manita ↔ Sonoraport API gap matrix.
3. Sandbox-only contract test plan.
4. Worldclock/Sandbox event schema proposal.
5. Explicit blockers and credential/onboarding prerequisites.
