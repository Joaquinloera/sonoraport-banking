import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const root = process.cwd();
const required = ["website/index.html","website/home/index.html","website/integrations/code-matrix.html","website/integrations/global-technology-evidence.json","website/integrations/americas-api-skim.json","website/integrations/build15-api-evidence.json","website/integrations/payment-corridors.html","src/gateway.mjs","src/gateway.test.mjs"];
let failures = 0;
for (const path of required) {
  if (!existsSync(join(root,path))) { console.error("MISSING",path); failures++; }
  else console.log("OK",path);
}
if (!failures) {
  const html = readFileSync(join(root,"website/index.html"),"utf8");
  for (const label of ["BRICS nations","Caribbean corridor","North Korea","Mexico &amp; South America"]) {
    if (!html.includes(label)) { console.error("MISSING CONTENT",label); failures++; }
  }
  for (const path of required.filter(x=>x.endsWith(".json"))) {
    const data = JSON.parse(readFileSync(join(root,path),"utf8"));
    if (!Array.isArray(data.providers)) { console.error("INVALID REGISTRY",path); failures++; }\n    if (path.includes("build15-api-evidence") && data.providers.length !== 4) { console.error("INVALID BUILD15 EVIDENCE",path); failures++; }
  }
}
if (!failures) { const gatewayTest = readFileSync(join(root,"src/gateway.test.mjs"),"utf8"); if (!gatewayTest.includes("payment initiation fails closed")) { console.error("MISSING GATEWAY SAFETY TEST"); failures++; } }\nif (failures) { console.error(failures,"website checks failed"); process.exit(1); }
console.log("SonoraPort website source checks passed");
