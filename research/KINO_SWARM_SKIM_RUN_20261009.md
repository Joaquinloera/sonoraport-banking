# SonoraPort SWARM + SKIM — Individual Research Run 2026-10-09/10

**Status: INCOMPLETE — not submitted for acceptance.**

## Verified live database
Project: `utnassdlhanlxbcovjmc`, table `public.kino_research_registry` (private, RLS enabled; no browser credentials). Direct SQL query confirmed **54 company records**:
- Banking 13; BRICS 1; payments 8; AI 8; government 4; internet 7; dispensary 7; blockchain 6.

This execution made **60 individual TinyFish searches**. Several searches returned unrelated third-party links. Only identified relevant official pages were entered into the live registry. All entries remain `initial_search`; detailed authentication, SDK, security and integration reviews are pending. Database is not connected to the live website; no deploy occurred.

## Verified official sources (sample)
- Wells Fargo: https://developer.wellsfargo.com/
- Citi: https://developer.citi.com/apidocs/
- Goldman Sachs: https://developer.gs.com/docs/services/transaction-banking/auth-connection/
- HSBC: https://develop.hsbc.com/
- BNP Paribas: https://group.bnpparibas/en/psd2-apis
- Cash App: https://developers.cash.app/cash-app-pay-partner-api/guides/welcome
- Zelle network partners: https://www.zelle.com/join-zelle-network/partners (not an open API)
- Apple Pay: https://developer.apple.com/documentation/applepayontheweb
- Visa: https://developer.visa.com/
- Anthropic: https://platform.claude.com/docs/en/api/overview
- Gemini: https://ai.google.dev/gemini-api/docs
- xAI: https://x.ai/api
- Cloudflare: https://developers.cloudflare.com/api/
- Dutchie: https://api.pos.dutchie.com/swagger/index.html
- Metrc: https://api-or.metrc.com/Documentation
- Coinbase CDP: https://docs.cdp.coinbase.com/api-reference/v2/authentication
- Fireblocks: https://developers.fireblocks.com/docs/quickstart

## Required next steps
1. Search and examine every missing named bank/provider individually. Flag unmatched sources; do not substitute another bank's portal.
2. Fetch official docs and record auth methods, SDKs, scopes, onboarding, security, and integrations.
3. Create authenticated server-side research API and private website Command Center.
4. Test API, database access, frontend, and deployment; check live URL.
5. Keep SonoraPort, Matcha Manita and Kayleen evidence separated; preserve original documents.
6. Save finished deliverables to Library and mark INCOMPLETE until all required steps pass.

**No API keys, license approvals, or bank partnerships are implied by these searches.**
