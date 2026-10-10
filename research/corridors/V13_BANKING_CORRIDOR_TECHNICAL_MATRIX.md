# SonoraPort SWARM + SKIM v13 — Banking Corridor Technical Matrix
Date: 2026-10-10
Status: RESEARCH ONLY. No credentials, production banking connections, transfers, balances, CBDC wallets or asset ownership verified.

| System | Corridor | Official source | Technical finding | Missing for implementation |
|---|---|---|---|---|
| Banco de México SPEI | Mexico | https://www.banxico.org.mx/services/interbanking-electronic-payme.html | Central-bank interbank electronic payment infrastructure; public page is NOT a general public transfer API | Participant onboarding, technical protocol, credentials, security profile, certification |
| BBVA API Market | Mexico/Global | https://www.bbvaapimarket.com/en/banking-apis/ | Public API product portal; specific API contract varies by product | OAuth/scopes, sandbox, product terms, certificates, admin portal |
| Bradesco | Brazil | https://developers.bradesco.com.br/ | Official developer portal available | Product endpoint docs, authentication, sandbox, approval |
| NPCI UPI | India | https://www.npci.org.in/ | Official UPI operator; public landing page is not sufficient API specification | Member/PSP eligibility, signed message specs, sandbox, access |
| ECCB DCash | Caribbean | https://www.eccb-centralbank.org/d-cash | Central bank digital-currency project; historical service interruptions documented | Current operational status, wallet/custody APIs, authorization, settlement model |
| BIS mBridge | Cross-border CBDC | https://www.bis.org/project/mbridge | Multi-CBDC research/project reference, not a publicly available production API | Jurisdiction/participant eligibility, legal status, production interfaces |

## Mandatory fields for every provider
1. Official source and dated verification.
2. API schema and version; endpoints; payloads; error codes.
3. Authentication type (OAuth2, mTLS, signed payloads, HMAC, API key); issuance authority; no invented keys.
4. SDK/languages, sandbox, test vectors, webhooks and idempotency.
5. Digital currency vs deposits vs stablecoin vs tokenized assets; custody, transfer and redemption model.
6. Administration portal roles, approvals, audit, reconciliation, risk and rate limits.
7. Eligibility, agreements, jurisdiction and test evidence.
8. Integration code and verified deployment status.

Research does not imply a bank partnership or authorized access. Do not place secrets in public frontend code.
