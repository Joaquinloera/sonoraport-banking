/** Research documentation status only; separate from financial, payment, or account APIs. */
import {createOfficialSourceEvidenceHandler} from '../../integrations/global-banking/official-source-evidence.mjs';
import evidence from '../../research/kino-official-api-source-intelligence-2026-10-13.json' with {type:'json'};
import registry from '../../data/global-banking-all-providers-registry.json' with {type:'json'};
const handle=createOfficialSourceEvidenceHandler({evidence,registry});
export default async function handler(request){return handle(request);}
export const config={path:['/api/banking-official-docs','/api/banking-official-docs/providers']};
