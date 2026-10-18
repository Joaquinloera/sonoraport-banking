"""Read-only HTTP API for public registry research; not a banking gateway."""
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
try:
    from .search_banks import search, coverage
except ImportError:
    from search_banks import search, coverage

def dispatch(path, database):
    parsed = urlsplit(path)
    q = parse_qs(parsed.query, keep_blank_values=True)
    if parsed.path == '/api/health':
        return 200, {'status':'ok','live_banking':False}
    if parsed.path == '/api/coverage':
        if q: return 400, {'error':'unexpected parameters'}
        return 200, coverage(database)
    if parsed.path != '/api/institutions':
        return 404, {'error':'not found'}
    allowed = {'country','name','license_type','classification_status','limit','offset'}
    if set(q)-allowed or any(len(v)!=1 for v in q.values()):
        return 400, {'error':'invalid parameters'}
    try:
        limit=int(q.get('limit',['50'])[0]); offset=int(q.get('offset',['0'])[0])
        filters={k:v[0] for k,v in q.items() if k not in ('limit','offset')}
        return 200, search(database,limit=limit,offset=offset,**filters)
    except (ValueError,TypeError):
        return 400, {'error':'invalid pagination or filter'}

def make_handler(database):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            try: status, result=dispatch(self.path,database)
            except (FileNotFoundError,OSError):
                status,result=503,{'error':'registry database unavailable'}
            body=json.dumps(result,ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.end_headers()
            self.wfile.write(body)
    return Handler

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--database',required=True)
    p.add_argument('--host',default='127.0.0.1')
    p.add_argument('--port',type=int,default=8765)
    a=p.parse_args()
    ThreadingHTTPServer((a.host,a.port),make_handler(a.database)).serve_forever()

if __name__=='__main__':
    main()
