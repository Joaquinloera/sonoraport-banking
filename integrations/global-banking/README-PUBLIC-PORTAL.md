# SonoraPort KINO — Global Banking Research Portal (BUILD 05)

This extends **existing** `Joaquinloera/sonoraport-banking`. Nothing in the existing research registry is overwritten.

## Actual software

- `netlify/functions/global-banking-research.mjs` — Netlify public read-only research function at `/api/global-banking/*`, loads existing source-controlled JSON and accepts GET/HEAD only.
- `integrations/global-banking/public-research-core.mjs` — allowlisted, sanitized provider metadata; historical financial account claims excluded; rejects live-connection assertions.
- `website/global-banking/` — responsive, accessible provider discovery UI, supports region filtering, source links, documentation view and registry view.
- `website/global-banking/research-seed.json` — 19 documented provider research records and 19 regional lanes, **not** 178 fictitious provider records; used only when deployed API is unavailable.

## Verified input sources

- `data/global-banking-all-providers-registry.json` (178 source records: 160 research, 18 unverified archive entries)
- `research/global-provider-api-auth-skim-2026-10-12.json` (19 public developer research records)
- `research/official-19-lane-execution-manifest-2026-10-12-v2.json` (19 regional lanes; 18 with two successfully fetched official documents)

## API routes

- `/api/global-banking/summary` — source and execution classification, no funds or credential access
- `/api/global-banking/providers?query=&region=&kind=&limit=30&offset=0` — paginated, filtered public research only
- `/api/global-banking/providers/:id` — public source lookup; archival records always 404
- `/api/global-banking/developer-docs` — vetted public auth/onboarding evidence, no secret values
- `/api/global-banking/regions` — regional source verification status; pending remains pending

No network requests to any financial institution are made when serving this API. The API has no POST, payment initiation, bank login, balances, wallets, or customer access operations.

## Running locally

```bash
node --test integrations/global-banking/public-research-core.test.mjs netlify/functions/global-banking-research.test.mjs website/global-banking/portal.test.mjs
```

For the static website, serve the repository directory over HTTP and navigate to `website/global-banking/`. The interface attempts the API, falling back to a **clearly labeled research snapshot** if the Netlify function isn't active.

## Deployment and access status

Source code tests or GitHub Actions success do **not** prove Netlify deployment. The live URL and Netlify function invocation must be checked after deployment. Do not claim the 144 logical agent roles are 144 independently hosted AI workers. Real queue execution still requires authorized staging Supabase, approved TinyFish server-side key, and hosted worker runtime. The original production database and provider accounts remain untouched.