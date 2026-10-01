/**
 * SonoraPort Banking — Secure Banking Runtime
 * Node.js 20+
 */

const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3100;
const HOST = process.env.HOST || "0.0.0.0";

const SERVICE_NAME = "sonoraport-banking";
const API_VERSION = "1.0.0";

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });

  res.end(JSON.stringify(data, null, 2));
}

function requestId() {
  return crypto.randomUUID();
}

function bankingCapabilities() {
  return {
    accounts: true,
    transactions: true,
    cards: true,
    transfers: true,
    statements: true,
    disputes: true,

    worldSandboxBridge: {
      enabled: true,
      authenticated: true
    },

    externalSettlement: {
      configured: Boolean(
        process.env.BANKING_SETTLEMENT_PROVIDER
      )
    }
  };
}

const server = http.createServer((req, res) => {
  const id = requestId();

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      error: "Method not allowed",
      requestId: id
    });
  }

  if (url.pathname === "/") {
    return sendJSON(res, 200, {
      service: SERVICE_NAME,
      message: "SonoraPort Banking API",
      version: API_VERSION,
      requestId: id
    });
  }

  if (url.pathname === "/api/health") {
    return sendJSON(res, 200, {
      service: SERVICE_NAME,
      status: "healthy",
      version: API_VERSION,
      runtime: process.version,
      timestamp: new Date().toISOString(),
      requestId: id
    });
  }

  if (url.pathname === "/api/capabilities") {
    return sendJSON(res, 200, {
      service: SERVICE_NAME,
      capabilities: bankingCapabilities(),
      timestamp: new Date().toISOString(),
      requestId: id
    });
  }

  if (url.pathname === "/api/world-sandbox/status") {
    return sendJSON(res, 200, {
      service: SERVICE_NAME,
      bridge: "worldsandbox13",
      status: "available",
      authority: {
        statusRead: true,
        capabilityRead: true,
        credentialRead: false,
        unrestrictedTransfers: false
      },
      timestamp: new Date().toISOString(),
      requestId: id
    });
  }

  return sendJSON(res, 404, {
    error: "Endpoint not found",
    requestId: id
  });
});

server.listen(PORT, HOST, () => {
  console.log(
    `SONORAPORT BANKING ONLINE — ${HOST}:${PORT}`
  );
});

module.exports = {
  server,
  bankingCapabilities
};
