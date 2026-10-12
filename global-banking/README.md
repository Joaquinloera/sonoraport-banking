# SonoraPort Global Banking foundation (development branch)

This is **not** a connected bank or production payments system. It provides simulation-only corridor planning, minor-unit balanced ledger validation, provider connection-state validation, and fail-closed live payment execution. Run tests using `node --test global-banking/test/*.test.mjs`.

Next: inventory reconciliation (157 original / 168 V2), approved provider adapters, Supabase RLS and schema migrations, signed webhook processing, FX references, merchant and digital-asset adapters, sanctions/compliance review, end-to-end tests, staging deployment. Keep credentials server-side; preserve production until verified.
