# SWARM + SKIM — production banking API research (2026-10-08)

Target site: https://sonoraportaiholdingllc.com
Repository: Joaquinloera/sonoraport-banking

This is public API documentation research, **not** a claim that SonoraPort holds credentials, provider approval, a banking charter, or live transaction authority. Never copy secrets into GitHub.

| Provider | Documented production authentication | Official documentation | Implementation gate |
|---|---|---|---|
| Plaid | Client ID and secret, then Link public-token exchange to server-held access token | https://plaid.com/docs/api/ ; https://plaid.com/docs/api/link/ | Verify approved production access and per-user consent |
| PayPal | Live REST app client ID/secret exchanged for OAuth 2.0 token | https://developer.paypal.com/api/rest/production ; https://developer.paypal.com/api/rest/requests | Confirm live app permissions and scopes |
| Treasury Prime | HTTP Basic authentication with API key ID and API key value | https://docs.treasuryprime.com/reference/authentication-1 | Confirm bank partnership and live tenant authorization |
| Synctera | Authorization: Bearer API key | https://docs.synctera.com/reference/need-to-know | Confirm production tenant and approved endpoints |
| Visa Direct | Mutual TLS with project certificate and issued credentials | https://developer.visa.com/capabilities/visa_direct/docs-authentication ; https://developer.visa.com/pages/working-with-visa-apis/two-way-ssl | Confirm production onboarding, certificate provisioning, network permissions |
| Stripe Treasury | Stripe API financial accounts; features depend on platform capabilities | https://docs.stripe.com/api/treasury/financial_accounts ; https://docs.stripe.com/treasury | Verify Treasury availability, platform approval and enabled capabilities |

## Code integration principles
- Server-only environment variables; no credentials in frontend JavaScript, static assets, logs or commits.
- Confirm Netlify site's actual deploy source before adding functions to the banking repository.
- Test read-only provider authentication before enabling any write operations.
- Use authenticated users, explicit authorization, least-privilege scopes, idempotency, and audit logs for future money movement.
- Keep all real-money execution disabled pending contractual, regulatory, identity and end-to-end checks.

## Research next
Verify official production API endpoints, authentication error behavior, webhook signing, key rotation, rate limits, and product eligibility per provider. Build only adapters for providers with verified account authorization.

Research gathered via TinyFish public web search; no private API keys retrieved.
