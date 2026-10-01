/**
 * SonoraPort Banking — Production Banking Runtime
 * Node.js 20+
 *
 * Production targets:
 * - Visa
 * - Mastercard
 * - PayPal
 * - Venmo
 * - Zelle
 * - JPMorganChase
 *
 * MATCHA MANITA:
 * - Server-to-server payment intent boundary
 *
 * Security:
 * - Credentials remain server-side.
 * - Credentials are never returned through APIs.
 * - Credential presence does not equal provider verification.
 * - Payment success is never fabricated.
 */

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT =
  Number(process.env.PORT) || 3100;

const HOST =
  process.env.HOST || "0.0.0.0";

const SERVICE_NAME =
  "sonoraport-banking";

const API_VERSION =
  "1.2.0";

const MAX_BODY_BYTES =
  64 * 1024;

const PRODUCTION_RAILS_FILE =
  path.join(
    __dirname,
    "data",
    "production-payment-rails.json"
  );

/*
 * Payment-intent storage.
 *
 * This is process-local storage.
 * Durable transactional storage is required
 * before production settlement execution.
 */
const paymentIntents =
  new Map();

const idempotencyIndex =
  new Map();

const auditReceipts =
  new Map();

/*
 * Load production payment-rail configuration.
 */
function loadProductionRails() {
  const registry =
    JSON.parse(
      fs.readFileSync(
        PRODUCTION_RAILS_FILE,
        "utf8"
      )
    );

  if (
    registry.environment !==
      "production" ||
    registry.system !==
      "sonoraport-banking" ||
    registry.executionAuthority !==
      "sonoraport-banking"
  ) {
    throw new Error(
      "Invalid production payment rails configuration."
    );
  }

  if (
    !registry.rails ||
    typeof registry.rails !== "object"
  ) {
    throw new Error(
      "Production payment rails are missing."
    );
  }

  return registry;
}

const productionRails =
  loadProductionRails();

/*
 * Determine whether required environment
 * configuration exists for a rail.
 *
 * This never exposes credential values.
 */
function railRuntimeStatus(id) {
  const rail =
    productionRails.rails[id];

  if (
    !rail ||
    rail.enabled !== true
  ) {
    return {
      enabled: false,
      environment: "production",
      configured: false,
      verified: false,
      status: "disabled"
    };
  }

  const requiredEnvironment =
    Array.isArray(
      rail.requiredEnvironment
    )
      ? rail.requiredEnvironment
      : [];

  /*
   * Rails without declared environment
   * credentials require external provisioning.
   */
  if (
    requiredEnvironment.length === 0
  ) {
    return {
      enabled: true,
      environment: "production",
      configured: false,
      verified: false,
      status:
        rail.status ||
        "awaiting-provider-provisioning"
    };
  }

  const configured =
    requiredEnvironment.every(
      variableName => {
        const value =
          process.env[variableName];

        return (
          typeof value === "string" &&
          value.trim().length > 0
        );
      }
    );

  return {
    enabled: true,
    environment: "production",
    configured,
    verified: false,
    status: configured
      ? "credentials-present-awaiting-provider-verification"
      : (
          rail.status ||
          "awaiting-production-credentials"
        )
  };
}

function productionRailStatus() {
  return {
    visa:
      railRuntimeStatus("visa"),

    mastercard:
      railRuntimeStatus(
        "mastercard"
      ),

    paypal:
      railRuntimeStatus("paypal"),

    venmo:
      railRuntimeStatus("venmo"),

    zelle:
      railRuntimeStatus("zelle"),

    jpmorganChase:
      railRuntimeStatus(
        "jpmorganChase"
      )
  };
}

function sendJSON(
  res,
  statusCode,
  data
) {
  res.writeHead(
    statusCode,
    {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store",

      "X-Content-Type-Options":
        "nosniff"
    }
  );

  res.end(
    JSON.stringify(
      data,
      null,
      2
    )
  );
}

function requestId() {
  return crypto.randomUUID();
}

function timingSafeEqualString(
  a,
  b
) {
  const left =
    Buffer.from(
      String(a || "")
    );

  const right =
    Buffer.from(
      String(b || "")
    );

  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    left,
    right
  );
}

/*
 * Legacy generic settlement flags remain
 * supported for compatibility, but they
 * cannot independently establish that a
 * production provider has verified a payment.
 */
function settlementConfigured() {
  return Boolean(
    process.env
      .BANKING_SETTLEMENT_PROVIDER &&
    process.env
      .BANKING_SETTLEMENT_CREDENTIAL
  );
}

function realSettlementAuthorized() {
  return (
    process.env
      .BANKING_REAL_SETTLEMENT_AUTHORIZED ===
      "true" &&
    settlementConfigured()
  );
}

function bankingCapabilities() {
  return {
    accounts: true,
    transactions: true,
    cards: true,
    transfers: true,
    statements: true,
    disputes: true,

    environment:
      "production",

    productionTarget:
      true,

    productionRails:
      productionRailStatus(),

    worldSandboxBridge: {
      enabled: true,
      authenticated: true
    },

    matchaManita: {
      paymentIntents: true,

      realSettlementAuthorized:
        realSettlementAuthorized(),

      providerConfirmationRequired:
        true
    },

    externalSettlement: {
      configured:
        settlementConfigured(),

      authorized:
        realSettlementAuthorized(),

      providerConfirmationRequired:
        true,

      unverifiedSettlementAllowed:
        false
    }
  };
}

function authenticateMatchaManita(
  req
) {
  const configuredToken =
    process.env
      .MATCHA_MANITA_BANKING_TOKEN;

  if (!configuredToken) {
    return {
      ok: false,
      statusCode: 503,
      error:
        "MATCHA MANITA banking authentication is not configured."
    };
  }

  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return {
      ok: false,
      statusCode: 401,
      error:
        "Authentication required."
    };
  }

  const suppliedToken =
    authorization.slice(7);

  if (
    !timingSafeEqualString(
      suppliedToken,
      configuredToken
    )
  ) {
    return {
      ok: false,
      statusCode: 403,
      error:
        "Invalid banking authorization."
    };
  }

  return {
    ok: true
  };
}

async function readJSONBody(req) {
  return new Promise(
    (resolve, reject) => {
      let body = "";
      let size = 0;
      let settled = false;

      req.on(
        "data",
        chunk => {
          if (settled) {
            return;
          }

          size += chunk.length;

          if (
            size >
            MAX_BODY_BYTES
          ) {
            settled = true;

            reject(
              new Error(
                "REQUEST_BODY_TOO_LARGE"
              )
            );

            req.destroy();

            return;
          }

          body += chunk;
        }
      );

      req.on(
        "end",
        () => {
          if (settled) {
            return;
          }

          settled = true;

          if (!body) {
            resolve({});
            return;
          }

          try {
            resolve(
              JSON.parse(body)
            );
          } catch {
            reject(
              new Error(
                "INVALID_JSON"
              )
            );
          }
        }
      );

      req.on(
        "error",
        error => {
          if (!settled) {
            settled = true;
            reject(error);
          }
        }
      );
    }
  );
}

function validateCreateIntent(
  body
) {
  const errors = [];

  if (
    !Number.isInteger(
      body.amount
    ) ||
    body.amount <= 0
  ) {
    errors.push(
      "amount must be a positive integer in the currency's smallest unit."
    );
  }

  if (
    typeof body.currency !==
      "string" ||
    !/^[A-Za-z]{3}$/.test(
      body.currency
    )
  ) {
    errors.push(
      "currency must be a three-letter currency code."
    );
  }

  if (
    body.orderId !==
      undefined &&
    (
      typeof body.orderId !==
        "string" ||
      body.orderId.length > 128
    )
  ) {
    errors.push(
      "orderId must be a string of 128 characters or fewer."
    );
  }

  if (
    body.description !==
      undefined &&
    (
      typeof body.description !==
        "string" ||
      body.description.length > 500
    )
  ) {
    errors.push(
      "description must be a string of 500 characters or fewer."
    );
  }

  return errors;
}

function hashObject(value) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");
}

function publicPaymentIntent(
  intent
) {
  return {
    id:
      intent.id,

    object:
      "payment_intent",

    amount:
      intent.amount,

    currency:
      intent.currency,

    orderId:
      intent.orderId,

    description:
      intent.description,

    status:
      intent.status,

    environment:
      intent.environment,

    settlementStatus:
      intent.settlementStatus,

    createdAt:
      intent.createdAt,

    updatedAt:
      intent.updatedAt
  };
}

function createAuditReceipt({
  action,
  intent,
  requestId: reqId
}) {
  const createdAt =
    new Date().toISOString();

  const receipt = {
    receiptId:
      `rcpt_${crypto.randomUUID()}`,

    protocol:
      "SONORAPORT-AUDIT-1",

    action,

    paymentIntentId:
      intent.id,

    paymentStatus:
      intent.status,

    environment:
      intent.environment,

    settlementStatus:
      intent.settlementStatus,

    requestId:
      reqId,

    createdAt
  };

  receipt.digest =
    hashObject(receipt);

  auditReceipts.set(
    intent.id,
    receipt
  );

  return receipt;
}

function getIntentId(
  pathname,
  suffix = ""
) {
  const escapedSuffix =
    suffix.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const expression =
    new RegExp(
      `^/api/matcha-manita/payment-intents/([^/]+)${escapedSuffix}$`
    );

  const match =
    pathname.match(expression);

  return match
    ? decodeURIComponent(
        match[1]
      )
    : null;
}

async function handleMatchaManita(
  req,
  res,
  url,
  reqId
) {
  const auth =
    authenticateMatchaManita(
      req
    );

  if (!auth.ok) {
    return sendJSON(
      res,
      auth.statusCode,
      {
        ok: false,
        error:
          auth.error,
        requestId:
          reqId
      }
    );
  }

  /*
   * POST /api/matcha-manita/payment-intents
   */
  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/matcha-manita/payment-intents"
  ) {
    const idempotencyKey =
      req.headers[
        "idempotency-key"
      ];

    if (
      typeof idempotencyKey !==
        "string" ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 255
    ) {
      return sendJSON(
        res,
        400,
        {
          ok: false,

          error:
            "A valid Idempotency-Key header is required.",

          requestId:
            reqId
        }
      );
    }

    const body =
      await readJSONBody(req);

    const errors =
      validateCreateIntent(
        body
      );

    if (errors.length) {
      return sendJSON(
        res,
        400,
        {
          ok: false,

          error:
            "Invalid payment intent request.",

          details:
            errors,

          requestId:
            reqId
        }
      );
    }

    const requestFingerprint =
      hashObject({
        amount:
          body.amount,

        currency:
          body.currency
            .toUpperCase(),

        orderId:
          body.orderId ||
          null,

        description:
          body.description ||
          null
      });

    const existing =
      idempotencyIndex.get(
        idempotencyKey
      );

    if (existing) {
      if (
        existing.fingerprint !==
        requestFingerprint
      ) {
        return sendJSON(
          res,
          409,
          {
            ok: false,

            error:
              "Idempotency key was already used with a different request.",

            requestId:
              reqId
          }
        );
      }

      const existingIntent =
        paymentIntents.get(
          existing.intentId
        );

      return sendJSON(
        res,
        200,
        {
          ok: true,

          idempotentReplay:
            true,

          paymentIntent:
            publicPaymentIntent(
              existingIntent
            ),

          requestId:
            reqId
        }
      );
    }

    const now =
      new Date().toISOString();

    const intent = {
      id:
        `pi_${crypto.randomUUID()}`,

      amount:
        body.amount,

      currency:
        body.currency
          .toUpperCase(),

      orderId:
        body.orderId ||
        null,

      description:
        body.description ||
        null,

      /*
       * Production target does not mean
       * payment authorization occurred.
       */
      status:
        "requires_authorization",

      environment:
        "production",

      /*
       * No provider has confirmed settlement.
       */
      settlementStatus:
        "not_executed",

      createdAt:
        now,

      updatedAt:
        now
    };

    paymentIntents.set(
      intent.id,
      intent
    );

    idempotencyIndex.set(
      idempotencyKey,
      {
        intentId:
          intent.id,

        fingerprint:
          requestFingerprint
      }
    );

    const receipt =
      createAuditReceipt({
        action:
          "payment_intent.created",

        intent,

        requestId:
          reqId
      });

    return sendJSON(
      res,
      201,
      {
        ok: true,

        paymentIntent:
          publicPaymentIntent(
            intent
          ),

        auditReceiptId:
          receipt.receiptId,

        settlementExecuted:
          false,

        providerConfirmed:
          false,

        requestId:
          reqId
      }
    );
  }

  /*
   * GET payment intent
   */
  if (
    req.method === "GET"
  ) {
    const intentId =
      getIntentId(
        url.pathname
      );

    if (intentId) {
      const intent =
        paymentIntents.get(
          intentId
        );

      if (!intent) {
        return sendJSON(
          res,
          404,
          {
            ok: false,
            error:
              "Payment intent not found.",
            requestId:
              reqId
          }
        );
      }

      return sendJSON(
        res,
        200,
        {
          ok: true,

          paymentIntent:
            publicPaymentIntent(
              intent
            ),

          requestId:
            reqId
        }
      );
    }
  }

  /*
   * Cancel payment intent
   */
  if (
    req.method === "POST"
  ) {
    const intentId =
      getIntentId(
        url.pathname,
        "/cancel"
      );

    if (intentId) {
      const intent =
        paymentIntents.get(
          intentId
        );

      if (!intent) {
        return sendJSON(
          res,
          404,
          {
            ok: false,

            error:
              "Payment intent not found.",

            requestId:
              reqId
          }
        );
      }

      if (
        intent.status ===
        "succeeded"
      ) {
        return sendJSON(
          res,
          409,
          {
            ok: false,

            error:
              "A succeeded payment intent cannot be cancelled.",

            requestId:
              reqId
          }
        );
      }

      if (
        intent.status !==
        "cancelled"
      ) {
        intent.status =
          "cancelled";

        intent.updatedAt =
          new Date()
            .toISOString();

        createAuditReceipt({
          action:
            "payment_intent.cancelled",

          intent,

          requestId:
            reqId
        });
      }

      return sendJSON(
        res,
        200,
        {
          ok: true,

          paymentIntent:
            publicPaymentIntent(
              intent
            ),

          requestId:
            reqId
        }
      );
    }
  }

  /*
   * Get audit receipt
   */
  if (
    req.method === "GET"
  ) {
    const intentId =
      getIntentId(
        url.pathname,
        "/receipt"
      );

    if (intentId) {
      const intent =
        paymentIntents.get(
          intentId
        );

      if (!intent) {
        return sendJSON(
          res,
          404,
          {
            ok: false,

            error:
              "Payment intent not found.",

            requestId:
              reqId
          }
        );
      }

      const receipt =
        auditReceipts.get(
          intentId
        );

      if (!receipt) {
        return sendJSON(
          res,
          404,
          {
            ok: false,

            error:
              "Audit receipt not found.",

            requestId:
              reqId
          }
        );
      }

      return sendJSON(
        res,
        200,
        {
          ok: true,

          receipt,

          requestId:
            reqId
        }
      );
    }
  }

  return sendJSON(
    res,
    404,
    {
      ok: false,

      error:
        "MATCHA MANITA banking endpoint not found.",

      requestId:
        reqId
    }
  );
}

const server =
  http.createServer(
    async (
      req,
      res
    ) => {
      const id =
        requestId();

      const url =
        new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );

      try {
        if (
          url.pathname.startsWith(
            "/api/matcha-manita/"
          )
        ) {
          return await handleMatchaManita(
            req,
            res,
            url,
            id
          );
        }

        if (
          req.method !==
          "GET"
        ) {
          return sendJSON(
            res,
            405,
            {
              error:
                "Method not allowed",

              requestId:
                id
            }
          );
        }

        if (
          url.pathname ===
          "/"
        ) {
          return sendJSON(
            res,
            200,
            {
              service:
                SERVICE_NAME,

              message:
                "SonoraPort Banking API",

              version:
                API_VERSION,

              environment:
                "production",

              requestId:
                id
            }
          );
        }

        if (
          url.pathname ===
          "/api/health"
        ) {
          return sendJSON(
            res,
            200,
            {
              service:
                SERVICE_NAME,

              status:
                "healthy",

              version:
                API_VERSION,

              environment:
                "production",

              runtime:
                process.version,

              timestamp:
                new Date()
                  .toISOString(),

              requestId:
                id
            }
          );
        }

        if (
          url.pathname ===
          "/api/capabilities"
        ) {
          return sendJSON(
            res,
            200,
            {
              service:
                SERVICE_NAME,

              environment:
                "production",

              capabilities:
                bankingCapabilities(),

              timestamp:
                new Date()
                  .toISOString(),

              requestId:
                id
            }
          );
        }

        /*
         * Production rail readiness.
     
