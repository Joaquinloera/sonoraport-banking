# NORTHCOM SWARM 01 — State Street Bank and Trust Company

FDIC certificate: 14. Focus: APIs, OAuth, digital assets, wallets, blockchain, metadata and code integration.

## Verified interfaces
- Developer portal: https://developer.statestreet.com/
- API onboarding: https://developer.statestreet.com/get-started-browser
- OAuth developer example: https://developer.statestreet.com/get-started-development-environment
- Token endpoint: POST https://api.statestreet.com/oauth/accesstoken
- Authentication: OAuth 2.0 client credentials. Register an application with State Street; permissions are scoped to the institution's approved API catalog.
- Rate limit: HTTP 429 is documented. Tokens expire dynamically, up to 30 minutes.
- Digital assets: State Street announced its Digital Asset Platform on January 15, 2026, including wallet management, custody, tokenized assets and cash capabilities, and private/public permissioned blockchain networks. This announcement does not establish a public wallet API or access to keys.
- API secrets: use only bank-issued credentials for an approved client app, store server-side in secret management, never in GitHub or browser code.
- Technical metadata: FDIC CERT 14; Boston, MA; developer portal and OAuth URLs above.
- Status: official docs verified; no customer credentials or live banking access configured.

## Next integration checks
1. Confirm client/partner entitlement to State Street's API catalog.
2. Obtain the authorized app's OAuth credentials through the portal.
3. Test the approved API product in the allowed environment; record response schema, scopes, rate limits and pagination.
4. Independently verify whether wallet, custody, digital-asset or blockchain products expose APIs to that client.
5. Keep every discovered integration field attached to this bank's FDIC identifier.

## Source references
- https://developer.statestreet.com/faqs
- https://developer.statestreet.com/documentation-usage
- https://investors.statestreet.com/investor-news-events/press-releases/news-details/2026/State-Street-Launches-Digital-Asset-Platform-to-Power-Tokenized-Finance/default.aspx
