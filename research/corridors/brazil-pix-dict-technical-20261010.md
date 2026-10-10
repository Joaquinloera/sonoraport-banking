# Brazil Pix and DICT — verified engineering notes (2026-10-10)

Status: research verified, **NOT CONNECTED**. No live credentials, account balances, transfers or bank authorization.

## Pix API
- Official OpenAPI source: https://github.com/bacen/pix-api
- Banco Central documentation: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
- Protocol: HTTPS REST with JSON.
- Security: OAuth 2.0 and mutual TLS (mTLS). TLS 1.2+ required by the cited manual.
- Onboarding: participant / PSP permissions and credentials required.

## DICT
- Official API: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html
- Source: https://github.com/bacen/pix-dict-api
- Uses mutual TLS, XML request/response payloads and XML digital signatures for writes; responses are signed.
- Rate limiting and anti-enumeration controls apply.
- Educational quickstart: https://github.com/bacen/pix-dict-quickstart (NOT production implementation).

## Implementation boundary
No private key material belongs in frontend code, public repository or research release. A production adapter requires server-side certificate handling, authorization, signature verification, structured error handling, idempotency and audit logs. None of those are claimed complete.

## Next steps
Review exact bank/PSP eligibility, scopes, sandbox credentials and certificate provisioning; add a read-only configuration validator and contract tests before any authorized financial operation.
