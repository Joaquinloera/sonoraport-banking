"use strict";
// Example HMAC boundary for synthetic/internal provider adapters ONLY.
// Each production provider requires its OWN documented signature specification.
const crypto = require("node:crypto");
function verifySignedEvent({rawBody,signature,timestamp,secret,now=Date.now(),maxSkewMs=300000}) {
  if (!Buffer.isBuffer(rawBody) || rawBody.length===0 || rawBody.length>1048576) throw new Error("invalid raw body");
  if (typeof secret!=="string" || secret.length<32) throw new Error("missing webhook secret");
  if (typeof signature!=="string" || !/^[a-f0-9]{64}$/i.test(signature)) throw new Error("invalid signature");
  if (typeof timestamp!=="string" || !/^\d{13}$/.test(timestamp)) throw new Error("invalid timestamp");
  const time=Number(timestamp);
  if (!Number.isSafeInteger(time) || Math.abs(now-time)>maxSkewMs) throw new Error("expired timestamp");
  const expected=crypto.createHmac("sha256",secret).update(timestamp).update(".").update(rawBody).digest();
  const supplied=Buffer.from(signature,"hex");
  if (!crypto.timingSafeEqual(expected,supplied)) throw new Error("signature mismatch");
  return true;
}
module.exports={verifySignedEvent};
