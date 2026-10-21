# Build 09 — Worldwide Banking Registry Recovery Gate (2026-10-21)

Status: **RECOVERY / AUDIT IN PROGRESS — NOT COMPLETE**

This build resumes the existing worldwide banking work rather than starting a small example directory.

## Verified repository findings
- `research/worldwide-banking/registry-source-queue-20261016.json` labels itself SOURCE_DISCOVERY_ONLY, zero institution records extracted in that file, and lists FDIC (US), ECB (EU), CNBV (MX), SARB (ZA), CBUAE (AE), and JFSA (JP) as PENDING.
- `research/worldwide-banking/regulator-extracted-banks.json` contains regulator-attributed institution records, separate from live provider connections.
- `website/swarm-skim/agent-skim-runner.mjs` explicitly limits its local input to 500 records, sets autonomousDiscovery=false and networkFetchPerformed=false. **Do not use this as an exhaustive global importer.**
- The Google Drive FDIC checkpoint is https://docs.google.com/spreadsheets/d/1fMHGO_GOlNWG-wTgNYnL-EUlygb0IuER3eBjKnAVtgo/edit ; the prior 4,219 figure must be rechecked against the sheet and its date.
- Earlier Build 098 and Build 108 Security Gate archives are already present in the repository.

## Acceptance criteria
1. Ingest full official source exports with explicit dates, source checksums, and count reconciliation. Never use a five- or eight-record sample as a completed national registry.
2. Distinguish chartered institutions, branches, ATMs, credit unions, payments firms and card networks; never sum unlike categories as 'banks'.
3. Record country, regulator, source date, institution ID, legal name, license/status and branch parent keys where available.
4. Build country-by-country ingestion that supports pagination and datasets larger than 500 records. No silent truncation.
5. Verify duplicate keys, missing identifiers, source freshness, official record totals, and country/regulator coverage.
6. Keep payments and card-skimming research defensive and public; no cardholder data, PINs, credentials, unauthorized access or operational fraud instructions.
7. Publish only after verified tests, database access checks, deployment preview and archived evidence.

## Current next action
Read the Drive FDIC sheet's actual headers, date and row count; compare with FDIC bulk Institutions and Locations. Reuse existing registry architecture. Then import complete source exports and validate. Do not claim completion until these steps actually run.
