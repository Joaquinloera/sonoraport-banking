# KINO BUILD 04 — Global Banking Research Gateway

This Node.js 22 service exposes public banking research metadata from SonoraPort's existing source registries. It is a read-only service, not a payment executor.

## Local usage

From the repository root:

```bash
node --test integrations/global-banking/research-http-gateway.test.mjs
SONORAPORT_RESEARCH_API_ENABLE=true node integrations/global-banking/research-http-gateway.mjs
```

The server binds to 127.0.0.1:3401 by default. No internet-facing deployment is created by these instructions.

## Routes

- GET /health
- GET /v1/providers?query=&region=&country=&kind=&limit=30&offset=0
- GET /v1/providers/stats
- GET /v1/providers/:id
- GET /v1/providers/:id/integration-checklist
- GET /v1/developer-research

Provider listings preserve source provenance. Historical institutional assertions are excluded from normal searches. Checklists remain nonproduction, pending separate provider onboarding.

## Test-only database integration

The separate `kino-ephemeral-postgres-queue-ci.yml` workflow runs the existing research-queue migration in a disposable PostgreSQL 16 service and validates real SQL leasing, role permissions, receipts and retries. It does not modify the SonoraPort Supabase project.

The 144 registered logical agents and banking catalog stay intact. Research gateway deployment, hosted worker execution, live bank connections and transfers remain separate tasks requiring independent verification.
