import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Server-only integration primitives. Never put provider secrets in website/.
 * No bank connection or money movement is enabled by this module.
 */
export function providerConfig(name, env = process.env) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) throw new TypeError('Invalid provider name');
  const key = env[`SONORAPORT_${name}_API_KEY`];
  const baseUrl = env[`SONORAPORT_${name}_BASE_URL`];
  if (!key || !baseUrl) throw new Error(`Missing server-side credentials for ${name}`);
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS provider URL required');
  return { baseUrl: url.origin, apiKey: key };
}

export function verifyWebhookHmac(body, signatureHex, secret) {
  if (typeof body !== 'string' && !Buffer.isBuffer(body)) return false;
  if (typeof signatureHex !== 'string' || !/^[0-9a-f]{64}$/i.test(signatureHex)) return false;
  if (typeof secret !== 'string' || !secret) return false;
  const actual = Buffer.from(signatureHex, 'hex');
  const expected = createHmac('sha256', secret).update(body).digest();
  return timingSafeEqual(actual, expected);
}

export function validateReadOnlyEndpoint(baseUrl, resourcePath) {
  const root = new URL(baseUrl);
  if (root.protocol !== 'https:' || root.username || root.password) throw new Error('HTTPS required');
  if (typeof resourcePath !== 'string' || !/^\/[a-zA-Z0-9/_?=&.%-]*$/.test(resourcePath) || resourcePath.startsWith('//')) throw new Error('Invalid resource path');
  const target = new URL(resourcePath, root.origin);
  if (target.origin !== root.origin) throw new Error('Cross-origin request forbidden');
  return target.href;
}
