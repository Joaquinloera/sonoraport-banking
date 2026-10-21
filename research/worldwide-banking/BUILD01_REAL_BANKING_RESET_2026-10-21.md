# BUILD 01 — REAL WORLDWIDE BANKING REGISTRY (RESET 2026-10-21)

## Binding scope
Build a production research and publication pipeline for **real, regulator-documented financial institutions** worldwide, for the SonoraPort websites. No invented, simulated, mock, or representative-only institution data. A limited extract may be used for debugging but must never be published as a complete national registry.

## Preserve existing architecture
- Main parent website: https://sonoraportaiholdingllc.com (shipping and oil; do not replace or merge it).
- Separate banking website: https://sonoraport-banking.netlify.app.
- Existing GitHub research and code remain intact. This is a **new Build 01 reset**, not deletion of prior builds.
- Existing worldwide banking datasets and source queues are inputs for provenance audit, not proof of complete coverage.

## Data contract
For each real institution: country ISO code; legal name; regulator; institution category; official registry ID where available; license/active status with effective date if available; authoritative source URL; source publication or retrieval date; verification state. Separate branch, ATM, credit union, bank, payment processor, card network and infrastructure entities. Do not infer an API integration or partner status from a registry entry.

## First ingestion lanes
1. US: FDIC full Institutions and Locations bulk datasets; supplement separately with NCUA credit unions and other regulators.
2. EU: ECB official lists with country-specific regulator sources.
3. MX, ZA, AE, JP: official CNBV, SARB, CBUAE, JFSA sources already queued.
4. Continue all jurisdictions using country-specific official sources, tracking absent or incomplete sources explicitly.

## Engineering acceptance
- Fetch entire published dataset, following pagination/continuation until exhaustion; no 500-row cap.
- Streaming or bounded-batch ingestion, checkpoints, retries, checksums, deduplication, regulator-specific schema mapping.
- Count reconciliation against source totals when published; no fabricated global totals.
- Searchable database and website output only after source verification and deployment checks.
- No cardholder data, credentials, unauthorized payment actions, or offensive skimming.

## Status at creation
**RESET SPECIFICATION COMMITTED. DATA IMPORT NOT YET EXECUTED.** This file must not be represented as a completed worldwide registry.
