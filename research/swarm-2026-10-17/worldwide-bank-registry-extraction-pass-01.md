# SWARM 2026-10-17 — Official worldwide bank registry extraction, pass 01

Scope: institution discovery from official regulatory sources, not an exhaustive global bank census. Source verification: TinyFish search and page extraction on 2026-10-17. This is extracted public documentation, not credentials, accounts, or working bank connections.

## United States — FDIC BankFind Suite
Source: https://api.fdic.gov/banks/docs/
Bank list: https://banks.data.fdic.gov/bankfind-suite/bankfind
Bulk datasets: https://banks.data.fdic.gov/bankfind-suite/bulkdata
Public API specification: https://api.fdic.gov/banks/docs/swagger.yaml
Institution field schema: https://api.fdic.gov/banks/docs/institution_properties.yaml
Additional public definitions: location_properties.yaml, history_properties.yaml, summary_properties.yaml, failure_properties.yaml, sod_properties.yaml, risview_properties.yaml, demographics_properties.yaml at https://api.fdic.gov/banks/docs/
Extracted: institution and branch data; structure changes, failures, deposits, financials. Query filters use Elasticsearch query-string syntax; output JSON/CSV via Accept header. Documentation states unique API keys are not currently required for every query. No private keys retrieved.
FDIC BankFind search result reported 4,220 insured institutions as of 2026-10-09; this is a source-reported count, not independently enumerated here.

## European Union / European Economic Area — EBA
Official registry hub: https://www.eba.europa.eu/risk-and-data-analysis/data/registers-and-other-list-institutions
Credit institution register: https://www.eba.europa.eu/risk-and-data-analysis/data/registers-and-other-list-institutions/credit-institutions-register
Payment/e-money register: https://www.eba.europa.eu/risk-and-data-analysis/data/registers/payment-institutions-register
Extracted: EBA publishes credit institutions authorized by competent authorities to operate in EU/EEA; separate central payment/e-money institution register. No open bank-payment API authorization implied.

## India — Reserve Bank of India
Official scheduled commercial banks list: https://www.rbi.org.in/scripts/bs_viewcontent.aspx?Id=3657
Official bank directory: https://m.rbi.org.in/CommonPerson/english/scripts/banksinindia.aspx
Extracted: regulator lists scheduled commercial banks and institutional categories; not a universal bank developer API.

## Mexico — Banco de México
Official financial institution list: https://www.banxico.org.mx/cep-scl/listaInstituciones.do
SPEI participant connection monitor: https://www.banxico.org.mx/monspei/
SPEI participation information: https://www.banxico.org.mx/servicios/spei_-informacion-banco-mex.html
Extracted: official participant institution codes/names and SPEI participation reference; not permission to initiate payments.

## Kenya — Central Bank of Kenya
Licensed commercial banks directory: https://www.centralbank.go.ke/bank-supervision/directory-of-licensed-commercial-banks-mortgage-finance-institutions-and-non-operating-holding-companies/
Official payment service providers directory: https://www.centralbank.go.ke/2022/09/14/directory-of-payment-service-providers/
Extracted: bank and authorized PSP registries; do not infer direct API access.

## Cross-border reference — J.P. Morgan Treasury Receivables
Official technical docs: https://developer.payments.jpmorgan.com/docs/treasury/receivables
Extracted from official search result: Request to Pay via QR Code Global covers supported corridors including Hong Kong FPS, India UPI, Singapore PayNow, and Brazil Pix; separate Brazil-local version. Availability depends on contractual onboarding and regional support.

### Verification boundary
This pass identifies six official regulator/developer source families and machine-readable US FDIC definitions. It does NOT claim to have enumerated every institution in each registry, inspected private software, obtained credentials, or deployed autonomous research agents. Next passes can enumerate institutions and extract each bank's publicly released developer docs.
