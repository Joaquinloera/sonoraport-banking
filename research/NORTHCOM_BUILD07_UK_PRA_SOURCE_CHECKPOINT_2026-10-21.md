# NORTHCOM Build 07 — Banking registry source and site integration checkpoint
Date: 2026-10-21
Project: SonoraPort banking research site (separate from SonoraPort AI Holding LLC shipping and oil main website)
Status: Primary-source verification checkpoint; not a complete UK import.

## Official source
Bank of England Prudential Regulation Authority (PRA)
https://www.bankofengland.co.uk/prudential-regulation/authorisations/which-firms-does-the-pra-regulate

The PRA publishes monthly lists of banks, building societies, credit unions, and insurers, and updates its designated investment firm list when changes occur. The page says the PRA regulates around 1,300 firms across these categories. This is an approximate cross-category figure, NOT a bank-only count.

## Source-observed bank examples (UK incorporated, authorized to accept deposits)
| Name | FRN | LEI |
|---|---|---|
| ABC International Bank Plc | 149025 | PQEBSF10YW5QXWIKTJ21 |
| Afin Bank Limited | 1004742 | 213800NRZ2K3AGEXHT08 |
| AIB GROUP (UK) P.L.C. | 122088 | 54930061N57ORAEPGX16 |
| Aldermore Bank Plc | 204503 | 2138009CAEGO41Q6HB61 |
| ALLICA BANK LIMITED | 821851 | 8945008WK6DNAUZQ7L32 |
| Atom Bank PLC | 661960 | 213800YWQOYL4VQODV50 |
| Barclays Bank UK PLC | 759676 | 213800UUGANOMFJ9X769 |
| ClearBank Limited | 754568 | 213800PERENGATFCHD95 |

These are a sample transcribed from the regulator's public table, not a complete UK registry.

## Data model for the upcoming bank research website
- regulator_name; source_url; source_observed_date
- original_regulatory_classification; normalized_institution_category
- institution_name; jurisdiction; regulator_reference_number; LEI
- verification_status (source_observed / independently_cross_checked)
- evidence_url; evidence_excerpt; last_reviewed_at
- API_docs_url; payment_rail_capabilities; ATM_network_documentation (only when independently supported)
- record_scope and count_basis (total records / deduplicated entities / verified banks)

## Existing US checkpoint
FDIC active institution count previously verified: 4,219. Full 9-column Google Sheet:
https://docs.google.com/spreadsheets/d/1fMHGO_GOlNWG-wTgNYnL-EUlygb0IuER3eBjKnAVtgo/edit
Do not add 4,219 to the PRA's ~1,300 figure as if they were the same category.

## Website integration plan
- GitHub: Joaquinloera/sonoraport-banking; preserve current site and existing assets.
- Supabase: Sonorportaiholdingllc project exists; schema and RLS require inspection before any writes.
- Netlify: sonoraport-banking project exists; use previews before production.
- Main company site: sonoraportaiholdingllc.com remains shipping/oil; future menu link points to the separate banking site.
- Google Drive: archive research evidence and build report.

## Security and evidence boundaries
Collect only public regulatory and technical information. No private API keys, customer payment card data, PINs, or operational card skimming. Research card skimming defensively.
No deployment or database migration was performed in this checkpoint.
