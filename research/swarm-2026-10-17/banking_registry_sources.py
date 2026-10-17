#!/usr/bin/env python3
"""SonoraPort global official banking registry source harvester.
Public regulator URLs only. Outputs a timestamped CSV of fetched page metadata.
Usage: python3 banking_registry_sources.py --output official_bank_sources.csv
No credentials, payment initiation, or private endpoints.
"""
import argparse, csv, datetime, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

SOURCES = [
("US","FDIC","https://api.fdic.gov/banks/docs/"),
("EU/EEA","EBA credit institutions","https://www.eba.europa.eu/risk-and-data-analysis/data/registers-and-other-list-institutions/credit-institutions-register"),
("EU/EEA","EBA payment institutions","https://www.eba.europa.eu/risk-and-data-analysis/data/registers/payment-institutions-register"),
("Australia","APRA ADI register","https://www.apra.gov.au/registers/list-registered-authorised-deposit-taking-institutions"),
("Singapore","MAS institutions","https://eservices.mas.gov.sg/fid/institution"),
("Switzerland","FINMA authorised institutions","https://www.finma.ch/en/finma-public/authorised-institutions-individuals-and-products/"),
("Canada","OSFI banks","https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks"),
("New Zealand","RBNZ registered banks","https://www.rbnz.govt.nz/regulation-and-supervision/cross-sector-oversight/registers-of-entities-we-regulate/registered-banks-in-new-zealand"),
("Saudi Arabia","SAMA local banks","https://www.sama.gov.sa/en-US/Supervision/LicenseEntities/Pages/LocalBanks.aspx"),
("UAE","Central Bank licensing","https://centralbank.ae/en/licensing/"),
("Colombia","Superfinanciera supervised entities","https://www.superfinanciera.gov.co/publicaciones/61694/industrias-supervisadasentidades-vigiladas-por-la-superintendencia-financiera-de-colombialista-general-de-entidades-vigiladas-por-la-superintendencia-financiera-de-colombia-61694/"),
("Ireland","Central Bank downloadable registers","https://registers.centralbank.ie/downloadspage.aspx"),
("Brazil","BCB CCR financial institutions","https://dadosabertos.bcb.gov.br/tl/dataset/lista-das-instituies-financeiras-autorizadas-a-operar-no-ccr"),
("India","RBI scheduled banks","https://www.rbi.org.in/scripts/bs_viewcontent.aspx?Id=3657"),
("Kenya","CBK licensed commercial banks","https://www.centralbank.go.ke/bank-supervision/directory-of-licensed-commercial-banks-mortgage-finance-institutions-and-non-operating-holding-companies/"),
("Mexico","Banxico SPEI participants","https://www.banxico.org.mx/cep-scl/listaInstituciones.do"),
("Global","BIS payments infrastructure","https://www.bis.org/committees/cpmi/payment"),
("Global","Citi statements API","https://developer.citi.com/apidocs/account-reporting/statements/statements-api-reference/"),
("Global","HSBC sandbox management","https://develop.hsbc.com/dev-hub/sandbox-data-management"),
]
def check(item):
    region,name,url=item
    request=urllib.request.Request(url,headers={"User-Agent":"SonoraPortPublicRegistryResearch/1.0","Accept":"text/html,application/json"})
    try:
        with urllib.request.urlopen(request,timeout=15) as response:
            return [region,name,url,response.status,response.url,response.headers.get("Content-Type",""),""]
    except urllib.error.HTTPError as e:
        return [region,name,url,e.code,url,"",str(e.reason)]
    except Exception as e:
        return [region,name,url,"",url,"",str(e)[:200]]
def main():
    p=argparse.ArgumentParser();p.add_argument("--output",default="official_bank_sources.csv");a=p.parse_args()
    rows=[]
    with ThreadPoolExecutor(max_workers=8) as pool:
        for future in as_completed([pool.submit(check,s) for s in SOURCES]):rows.append(future.result())
    with open(a.output,"w",newline="",encoding="utf-8") as out:
        writer=csv.writer(out);writer.writerow(["region","authority","source_url","http_status","final_url","content_type","error"]);writer.writerows(sorted(rows))
    print(f"{datetime.datetime.now(datetime.timezone.utc).isoformat()} checked={len(rows)} ok={sum(x[3]==200 for x in rows)} output={a.output}")
if __name__=="__main__":main()
