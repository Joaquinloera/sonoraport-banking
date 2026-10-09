# SonoraPort BRICS Banking Intelligence — Research Pass 01 (2026-10-09)

Scope: China, India, Russia, Iran; banks, payment networks, API portals, authentication, software, and legal eligibility. **Research only: no affiliation, production credentials, live transaction, or permission to evade sanctions.**

## BRICS versus New Development Bank
BRICS political membership is not the same as membership in the New Development Bank (NDB). NDB official members page lists founding Brazil/Russia/India/China/South Africa plus Bangladesh, UAE, Egypt, Algeria, Uzbekistan; Iran is **not listed as an NDB member** on this page (as checked 2026-10-09).
Source: https://www.ndb.int/about-ndb/members/

## China
- **Bank of China:** corporate open banking / host-to-host; account status, transfers, reconciliation, cross-border services; partner authorization required. https://www.bankofchina.com/english/enterprises/trb/osc/202601/t20260109_25641179.html
- **Bank of China (Hong Kong):** documented OAuth 2.0 client_credentials, client ID and client secret after app approval; sandbox and production separate. https://api.bochk.com/Partnerwithus.html
- **China Construction Bank:** open platform with app/product/certificate applications, development testing and go-live application. https://open.ccb.cn/
- **China Construction Bank (Asia):** account balance and transaction API Swagger downloads. https://www.asia.ccb.com/hongkong/global/api/index.html
- **ICBC:** official API platform exists, technical access not verified. https://gw.open.icbc.com.cn/ui/
- **UnionPay International:** JSON QR acceptance and other payment APIs, developer sandbox, testing/certification and partner onboarding; not automatic merchant access. https://www.unionpayintl.com/ZT/pre/api/en/ and https://open.unionpayintl.com/
- **CIPS:** RMB cross-border messaging infrastructure and route guide APIs; ISO 20022-based standards, participation/eligibility restrictions. https://www.cips.com.cn/kjjqgsyyingw/cipsfw/

## India
- **HDFC Bank:** developer API catalog; sandbox; application client ID/client secret; registration verification; production approval. https://developer.hdfc.bank.in/get-started
- **ICICI Bank:** developer sandbox, API keys per registered app, UAT, bank-approved production; cash management, payments, collections and reconciliation. https://api-portal.icici.bank.in/
- **NPCI UPI:** national interoperable payment architecture, international QR acceptance at select supported merchants; not a public universal API key. https://www.npci.org.in/product/upi-global-acceptance

## Russia
- **Sber:** Sber API docs, Java/Node.js SDK, scoped client IDs, onboarding and agreements. Research-only; sanctions screening required before any commercial use. https://developers.sber.ru/docs/ru/sber-api/overview and https://developers.sber.ru/docs/ru/sber-api/sdk/overview
- **Bank of Russia SPFS:** financial message transport; settlement between banks uses correspondent relationships. Not a public merchant API. https://www.cbr.ru/Psystem/fin_msg_transfer_system/
- **Mir/SBP:** national card/fast-payment infrastructure; access and sanctions restrictions need review. https://www.cbr.ru/psystem/

## Iran
- **Bank Melli, Bank Mellat, Bank Sepah, Bank Pasargad, Bank Saman, Bank Saderat:** names identified for further individual institution verification; no direct bank API keys or integration eligibility verified in this pass.
- **Shetab / Shaparak:** domestic card/payment gateway infrastructure. Third-party open-source Shaparak wrappers exist, but source code is not evidence of lawful integration access. https://github.com/php-monsters/shaparak
- **Sepal payment gateway:** Persian-language developer API documentation shows bearer authorization and merchant-issued apiKey after approval; no authorization for U.S. business inferred. https://www.3pal.ir/static/api
- **Critical U.S. legal gate:** OFAC Iran sanctions; U.S. Treasury issued a September 2026 warning/designation concerning Iranian financial-sector dealings. No live API connection, onboarding or transfers should proceed without qualified sanctions counsel and applicable authorization. https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions and https://home.treasury.gov/news/press-releases/sb0629/

## Technology stack patterns for SonoraPort
1. Provider registry with official API docs URL, legal entity, region, API method, auth mode, credential issuer, sandbox availability, contract status and sanctions clearance.
2. Provider adapters behind a **disabled-by-default** capability gate; read-only/synthetic first.
3. OAuth 2.0 client credentials, bank-issued client secrets, certificates/mTLS or signatures as required **by each actual provider**; no guessed endpoints, keys, or secrets in repository.
4. Signed webhook ingestion, replay controls, immutable event log, idempotency, reconciliation and audit.
5. ISO 20022 / transaction message normalization where contractually appropriate; no implication that ISO 20022 alone provides network membership.
6. Explicit status labels: RESEARCHED, DOCUMENTED, SANDBOX-APPROVED, CONTRACTED, PRODUCTION-VERIFIED; no bank partnership claim until documented.

## Priority follow-ups
A. Deep-dive China: BOCHK OAuth sample, UnionPay API signing, CIPS message schema and participant onboarding.
B. Deep-dive India: HDFC/ICICI API auth, sandbox requirements, permitted overseas entities.
C. Russia/Iran: research public architecture and sanctions exposure only, not integration activation.
D. Cross-border legal: sanctions, AML/KYC, export restrictions, data residency, cannabis merchant eligibility.
E. Keep brand clean: **SonoraPort AI Holdings LLC** as own corporate identity, **BRICS financial institutions** as research/coverage category, never imply endorsement or affiliation.
