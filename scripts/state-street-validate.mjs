import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync(new URL('../website/integrations/state-street.integration.json',import.meta.url),'utf8'));
if(x.bank.fdic_certificate!=='14'||!x.secrets.never_commit)throw Error('Invalid bank config');
if(!x.developer.oauth_token_url.startsWith('https://'))throw Error('HTTPS required');
console.log('State Street integration configuration validated (no live API call).');
