# SonoraPort v10 additive recovery record

Status: **INCOMPLETE — research-only; not production deployed**

## Handoff verified
- Input: SonoraPort_KINO_New_Chat_Handoff_v9.zip
- Embedded v9 research ZIP SHA256: df17fcd534f01191d5b82bed66dbb9a3ee750968e85f62fe14aa5ac7135e814c
- v9: 40 provider records; 10 HTML pages.
- v10: 48 provider records, with 8 nonduplicate additions.
- Added additive research/v10-numeric-assets/index.html and numeric.js in release ZIP; original v9 pages preserved.
- v10 ZIP in ChatGPT Library: /SonoraPort_Research_Release_v10_ADDITIVE_RESEARCH_ONLY.zip

## Added provider records
Treasury Prime; Banco Central do Brasil Pix; BlackRock Aladdin; FIDO Alliance; NCBI E-utilities; Pinal County Assessor; Pinal County Recorder; Maricopa County Recorder.

## Research checks
Individual TinyFish queries: Treasury Prime, Banco Central do Brasil Pix, NPCI UPI, China CIPS, Mexico SPEI, NVIDIA, IBM watsonx, NIST AI RMF. Results are not proof of API access. Only official references retained.

## Tests
JSON valid, JavaScript syntax pass, internal links pass, provider duplicate check pass, ZIP integrity pass. Browser tests not run. No secret or live financial API credentials supplied. Full production source merge not performed.

## Netlify production verification
Site ID 588bcdea-734c-4b3c-a225-1ef92c20ef53; published deploy 6ac521aa1d3bf44138ef1fad confirmed ready/current. Deploy title: Build from drop deployment. **Do not deploy standalone v10 research ZIP over production.**

## Next engineering task
Recover the complete Netlify production source, compare against v9/v10 and historical archives, add research routes without replacing banking functionality, perform browser/mobile and security tests, then stage an authorized deploy candidate.
