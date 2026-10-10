# KINO SWARM + SKIM — SonoraPort Research Registry

Status: INCOMPLETE. Not an accepted build.

## Live database
Supabase project: `utnassdlhanlxbcovjmc`
Table: `public.kino_research_registry`

The table was created with RLS enabled and direct access revoked from `anon` and `authenticated`. No public browser access is authorized. Do not put service-role credentials in frontend code.

## Initial individual TinyFish searches (2026-10-09/10)
| Category | Company | Source | Review status |
| --- | --- | --- | --- |
| Banking | JPMorgan Chase | https://developer.jpmorgan.com/ | Initial search only |
| Banking | ICBC | https://open.icbc.com.cn/icbc/apip/europe/index.html | Initial search only |
| BRICS | New Development Bank | https://www.ndb.int/ | Initial search only; no developer API verified |
| AI | OpenAI Codex | https://developers.openai.com/api/docs | Initial search only |
| Payments | Stripe | https://docs.stripe.com/api | Initial search only |
| Government | USA.gov | https://www.usa.gov/ | Initial search only; related federal APIs require separate review |
| Internet | Comcast Xfinity | https://www.xfinity.com/ | Initial search only; official public developer API not verified |
| Dispensary | Dutchie | https://api.pos.dutchie.com/swagger/index.html | Initial search only |
| Blockchain | Ethereum | https://ethereum.org/developers/docs/ | Initial search only |

## Mandatory every-build workflow
1. Research **each required named company individually** with TinyFish, retaining returned source links.
2. Examine official documentation for authentication, SDKs, security, and integration requirements. Mark unknowns explicitly.
3. Update the registry for all required companies, even when a result is unavailable; never treat a search as a completed review.
4. Integrate authorized findings into the correct project. Keep Matcha Manita and property evidence separate.
5. Run code and database tests, verify GitHub and deployment, and save verified artifacts to Library.
6. Mark INCOMPLETE if any required company or execution step is skipped.

## Next engineering steps
Build an authenticated server-side research API and private Command Center UI. Do not expose the registry via public read policies or embed Supabase service-role keys. No website deployment or live integration has been performed in this checkpoint.
