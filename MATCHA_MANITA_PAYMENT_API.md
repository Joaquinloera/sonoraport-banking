# MATCHA MANITA — SonoraPort Banking API Contract

Version: 1.0.0  
Service: SonoraPort Banking  
Integration: MATCHA MANITA  
Protocol: HTTPS + JSON  
Authentication: Server-to-server Bearer authentication

---

## 1. Purpose

This API provides the authorized server-side banking boundary between MATCHA MANITA and SonoraPort Banking.

MATCHA MANITA must never store or expose:

- Banking credentials
- Settlement credentials
- Provider private keys
- Banking API tokens
- Account secrets
- Payment-provider secrets

Browser/client code must never communicate directly with protected SonoraPort Banking infrastructure.

Required architecture:

```text
MATCHA MANITA browser
        ↓
MATCHA MANITA server-side adapter
        ↓
SonoraPort Banking API
        ↓
Authentication + authorization
        ↓
Policy and transaction checks
        ↓
Authorized payment provider
        ↓
Provider verification
        ↓
SonoraPort Banking transaction status
        ↓
Audit receipt
        ↓
MATCHA MANITA order status
```

Real-money settlement is disabled unless separately configured, explicitly authorized, and implemented through an authorized provider.

---

## 2. Base Endpoint

Application API base path:

`/api/matcha-manita`

Production host configuration is deployment-specific.

MATCHA MANITA must obtain the SonoraPort Banking service URL from server-side environment configuration.

Do not hard-code private banking endpoints or credentials into browser JavaScript.

Example server-side configuration name:

`SONORAPORT_BANKING_BASE_URL`

A complete request would therefore use:

`SONORAPORT_BANKING_BASE_URL + /api/matcha-manita/...`

---

## 3. Authentication

Protected requests require:

`Authorization: Bearer <SERVER_TOKEN>`

The authentication token must exist only in server-side environment configuration.

MATCHA MANITA browser code must never receive this token.

Required SonoraPort Banking environment variable:

`MATCHA_MANITA_BANKING_TOKEN`

No credential value belongs in GitHub.

---

## 4. Create Payment Intent

Endpoint:

`POST /api/matcha-manita/payment-intents`

Required headers:

`Authorization: Bearer <SERVER_TOKEN>`

`Content-Type: application/json`

`Idempotency-Key: <UNIQUE_REQUEST_KEY>`

Example request:

```json
{
  "amount": 1250,
  "currency": "USD",
  "orderId": "MATCHA-ORDER-001",
  "description": "MATCHA MANITA order"
}
```

`amount` is expressed in the currency's smallest unit.

For USD:

`1250` = `$12.50`

Example response:

```json
{
  "ok": true,
  "paymentIntent": {
    "id": "pi_generated_identifier",
    "object": "payment_intent",
    "amount": 1250,
    "currency": "USD",
    "orderId": "MATCHA-ORDER-001",
    "description": "MATCHA MANITA order",
    "status": "requires_authorization",
    "mode": "sandbox",
    "createdAt": "ISO-8601 timestamp",
    "updatedAt": "ISO-8601 timestamp"
  },
  "auditReceiptId": "rcpt_generated_identifier",
  "settlementExecuted": false,
  "requestId": "generated-request-id"
}
```

Creating a payment intent does NOT mean money has moved.

The API must never report payment success merely because an intent was created.

---

## 5. Retrieve Payment Intent

Endpoint:

`GET /api/matcha-manita/payment-intents/:id`

Required header:

`Authorization: Bearer <SERVER_TOKEN>`

Example response:

```json
{
  "ok": true,
  "paymentIntent": {
    "id": "pi_generated_identifier",
    "object": "payment_intent",
    "amount": 1250,
    "currency": "USD",
    "orderId": "MATCHA-ORDER-001",
    "description": "MATCHA MANITA order",
    "status": "requires_authorization",
    "mode": "sandbox",
    "createdAt": "ISO-8601 timestamp",
    "updatedAt": "ISO-8601 timestamp"
  },
  "requestId": "generated-request-id"
}
```

---

## 6. Cancel Payment Intent

Endpoint:

`POST /api/matcha-manita/payment-intents/:id/cancel`

Required header:

`Authorization: Bearer <SERVER_TOKEN>`

Cancellation changes the payment-intent state.

Cancellation does not fabricate a refund, reversal, provider transaction, or settlement event.

Example response:

```json
{
  "ok": true,
  "paymentIntent": {
    "id": "pi_generated_identifier",
    "object": "payment_intent",
    "amount": 1250,
    "currency": "USD",
    "orderId": "MATCHA-ORDER-001",
    "description": "MATCHA MANITA order",
    "status": "cancelled",
    "mode": "sandbox",
    "createdAt": "ISO-8601 timestamp",
    "updatedAt": "ISO-8601 timestamp"
  },
  "requestId": "generated-request-id"
}
```

---

## 7. Retrieve Audit Receipt

Endpoint:

`GET /api/matcha-manita/payment-intents/:id/receipt`

Required header:

`Authorization: Bearer <SERVER_TOKEN>`

Example response:

```json
{
  "ok": true,
  "receipt": {
    "receiptId": "rcpt_generated_identifier",
    "protocol": "SONORAPORT-AUDIT-1",
    "action": "payment_intent.created",
    "paymentIntentId": "pi_generated_identifier",
    "paymentStatus": "requires_authorization",
    "mode": "sandbox",
    "requestId": "generated-request-id",
    "createdAt": "ISO-8601 timestamp",
    "digest": "sha256-digest"
  },
  "requestId": "generated-request-id"
}
```

An audit receipt records an API event.

It must not be represented as proof that an external financial institution settled a transaction unless settlement has actually been independently verified.

---

## 8. Payment Intent States

Current implemented states include:

`requires_authorization`

`cancelled`

Future provider-backed states may include:

`processing`

`authorized`

`succeeded`

`failed`

A provider-backed payment must not enter `succeeded` until SonoraPort Banking verifies the result through the authorized payment or settlement provider.

---

## 9. Idempotency

Payment-intent creation requires:

`Idempotency-Key`

Repeated requests using the same key and identical payment parameters return the existing payment intent.

Reusing an idempotency key with different payment information produces a conflict response.

This protects against accidental duplicate payment-intent creation.

The idempotency key is not a banking credential.

MATCHA MANITA should generate a unique idempotency key server-side for each intended payment operation.

---

## 10. Input Validation

Payment-intent creation validates:

### Amount

Must be a positive integer expressed in the currency's smallest unit.

### Currency

Must be a three-letter currency code.

Example:

`USD`

### Order ID

Optional.

Maximum length:

`128 characters`

### Description

Optional.

Maximum length:

`500 characters`

Invalid requests must be rejected before any provider settlement attempt.

---

## 11. Sandbox Mode

Without authorized settlement configuration, MATCHA MANITA operates through SonoraPort Banking in sandbox mode.

Sandbox intent creation:

- Creates the payment intent
- Creates an audit record
- Tests authentication
- Tests authorization boundaries
- Tests idempotency
- Tests transaction-state handling
- Tests cancellation
- Tests receipt generation
- Does not move real money
- Does not claim settlement occurred

The SonoraPort Banking CI workflow tests this sandbox boundary.

---

## 12. Real-Money Settlement Gate

Real-money settlement requires authorized settlement configuration and explicit authorization.

Required authorization flag:

`BANKING_REAL_SETTLEMENT_AUTHORIZED=true`

Settlement configuration also requires:

`BANKING_SETTLEMENT_PROVIDER`

and:

`BANKING_SETTLEMENT_CREDENTIAL`

The presence of environment variables alone does not prove that a provider integration is operational.

Provider transport must be implemented and verified before external settlement can occur.

If the authorization and provider requirements are not satisfied, SonoraPort Banking remains non-settling.

---

## 13. Transaction Verification

A payment must never be marked `succeeded` simply because:

- A payment intent exists
- A request was accepted
- A browser reports success
- A customer returns to a success page
- An order exists
- An API call returned without an exception

For provider-backed payments, SonoraPort Banking must verify authoritative provider transaction status before recording successful settlement.

Provider webhooks or equivalent server-side verification should be authenticated before affecting authoritative order/payment state.

---

## 14. Audit Receipts

SonoraPort Banking creates audit receipts for payment-intent events.

Current receipt protocol:

`SONORAPORT-AUDIT-1`

Receipts contain information including:

- Receipt identifier
- Payment-intent identifier
- Action
- Payment status
- Runtime mode
- Request identifier
- Timestamp
- SHA-256 digest

Audit receipts support traceability.

An internal audit receipt does not independently prove external financial settlement.

---

## 15. Error Handling

Expected HTTP responses include:

`200` — successful retrieval, cancellation, or idempotent replay

`201` — payment intent created

`400` — invalid request

`401` — authentication required

`403` — invalid banking authorization

`404` — payment intent, receipt, or endpoint not found

`409` — idempotency conflict or invalid state transition

`413` — request body too large

`500` — internal banking service error

`503` — MATCHA MANITA banking authentication is not configured

Error responses include a request identifier when available.

---

## 16. Environment Variable Names

### SonoraPort Banking

`MATCHA_MANITA_BANKING_TOKEN`

`BANKING_REAL_SETTLEMENT_AUTHORIZED`

`BANKING_SETTLEMENT_PROVIDER`

`BANKING_SETTLEMENT_CREDENTIAL`

`PORT`

`HOST`

### MATCHA MANITA server

Recommended configuration name:

`SONORAPORT_BANKING_BASE_URL`

MATCHA MANITA also requires access to the corresponding server-to-server authentication credential through secure deployment configuration.

Only environment-variable NAMES belong in source documentation.

Never commit secret VALUES to GitHub.

Never place secret VALUES in browser JavaScript.

---

## 17. Security Rules

MATCHA MANITA must:

1. Call SonoraPort Banking from server-side code only.
2. Never expose the banking bearer token to browser code.
3. Never store provider credentials in the frontend.
4. Never place private keys in GitHub.
5. Validate order amounts server-side.
6. Generate unique idempotency keys.
7. Verify transaction status before marking an order paid.
8. Store authoritative payment identifiers.
9. Preserve audit receipts.
10. Reject unverified payment-success claims.
11. Use HTTPS for production server-to-server communication.
12. Fail closed when banking authentication is unavailable.
13. Keep settlement credentials outside WorldSandbox13.
14. Keep provider credentials outside MATCHA MANITA browser code.

---

## 18. World Sandbox Separation

WorldSandbox13 remains a separate integration and orchestration boundary.

Existing relationship:

```text
WorldSandbox13
        ↓
SonoraPort Banking bridge
        ↓
Health / capabilities / authorized status
```

MATCHA MANITA banking relationship:

```text
MATCHA MANITA
        ↓
MATCHA MANITA server
        ↓
SonoraPort Banking
        ↓
Payment Provider Router
        ↓
Authorized Provider
```

WorldSandbox13 must not receive SonoraPort Banking master credentials.

SonoraPort Banking remains authoritative for banking/payment execution.

WorldSandbox13 may coordinate permitted integration information without becoming the holder of banking secrets.

---

## 19. Future Payment Provider Router

SonoraPort Banking can later provide a controlled payment-provider router.

Planned architecture:

```text
MATCHA MANITA
        ↓
SonoraPort Banking
        ↓
Payment Provider Router
        ├── PayPal adapter
        ├── Venmo adapter
        ├── Apple Pay adapter
        ├── Cash App adapter
        └── Zelle adapter
```

Each provider must have its own authorized integration path.

A provider must not be marked connected merely because its name exists in the registry or interface.

Provider credentials remain server-side.

Where a provider does not expose an appropriate authorized merchant/API integration, SonoraPort Banking must not fabricate one.

---

## 20. Payment Provider Requirements

Before enabling a provider for real transactions, SonoraPort Banking should require:

- Authorized merchant/provider account
- Official provider integration
- Server-side credentials
- Credential validation
- HTTPS
- Provider-specific request validation
- Provider transaction identifiers
- Provider status verification
- Webhook verification where supported
- Idempotency
- Error handling
- Audit logging
- Explicit production authorization

Each provider adapter must fail closed when configuration is missing.

---

## 21. Current Verified Integration State

SonoraPort Banking currently exposes:

`POST /api/matcha-manita/payment-intents`

`GET /api/matcha-manita/payment-intents/:id`

`POST /api/matcha-manita/payment-intents/:id/cancel`

`GET /api/matcha-manita/payment-intents/:id/receipt`

Current integration supports:

- Server-side authentication
- Input validation
- Idempotency protection
- Payment-intent creation
- Payment-intent status retrieval
- Cancellation
- Audit receipts
- Sandbox operation
- Protected banking credentials
- Real-settlement gating
- World Sandbox separation

The SonoraPort Banking GitHub Actions workflow tests the MATCHA MANITA sandbox payment-intent boundary.

The current runtime does not claim an external payment or settlement provider is connected.

The current runtime does not automatically move real money.

External provider settlement must be separately implemented, authenticated, authorized, tested, and verified.

---

## 22. MATCHA MANITA Handoff Contract

MATCHA MANITA should integrate against SonoraPort Banking using:

### Create

`POST /api/matcha-manita/payment-intents`

### Status

`GET /api/matcha-manita/payment-intents/:id`

### Cancel

`POST /api/matcha-manita/payment-intents/:id/cancel`

### Receipt

`GET /api/matcha-manita/payment-intents/:id/receipt`

MATCHA MANITA must call these endpoints from its server-side runtime.

MATCHA MANITA must treat:

`requires_authorization`

as NOT PAID.

MATCHA MANITA must treat:

`cancelled`

as NOT PAID.

Future:

`succeeded`

may be treated as paid only after SonoraPort Banking implements and performs authoritative provider verification.

---

## 23. Authority Boundary

Final authority chain:

```text
CUSTOMER
   ↓
MATCHA MANITA
   ↓
MATCHA MANITA SERVER
   ↓
SONORAPORT BANKING
   ↓
AUTHENTICATION
   ↓
AUTHORIZATION
   ↓
POLICY CHECKS
   ↓
PAYMENT PROVIDER ROUTER
   ↓
AUTHORIZED PROVIDER
   ↓
PROVIDER VERIFICATION
   ↓
SONORAPORT BANKING STATUS
   ↓
AUDIT RECEIPT
   ↓
MATCHA MANITA ORDER STATUS
```

SonoraPort Banking remains the authoritative banking boundary.

MATCHA MANITA remains the commerce/application layer.

WorldSandbox13 remains the global orchestration/integration layer.

Provider systems remain external systems requiring their own authorized connections.
