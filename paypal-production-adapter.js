"use strict";

const crypto = require("crypto");

const PAYPAL_LIVE_BASE_URL = "https://api-m.paypal.com";

class PayPalProductionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PayPalProductionError";
    this.details = details;
  }
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new PayPalProductionError(
      "PayPal production credentials are not configured."
    );
  }

  return {
    clientId,
    clientSecret
  };
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new PayPalProductionError(
      "PayPal returned a non-JSON response.",
      {
        status: response.status
      }
    );
  }
}

async function getAccessToken() {
  const {
    clientId,
    clientSecret
  } = getCredentials();

  const authorization = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_LIVE_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Basic ${authorization}`,

        "Content-Type":
          "application/x-www-form-urlencoded",

        Accept:
          "application/json"
      },

      body:
        "grant_type=client_credentials"
    }
  );

  const data =
    await parseResponse(response);

  if (
    !response.ok ||
    typeof data.access_token !== "string"
  ) {
    throw new PayPalProductionError(
      "PayPal production authentication failed.",
      {
        status: response.status,
        error:
          data.error || null,
        errorDescription:
          data.error_description || null
      }
    );
  }

  return data.access_token;
}

function validateAmount({
  amount,
  currency
}) {
  if (
    typeof amount !== "string" ||
    !/^\d+\.\d{2}$/.test(amount)
  ) {
    throw new PayPalProductionError(
      "PayPal amount must use a decimal string such as 12.50."
    );
  }

  if (
    typeof currency !== "string" ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    throw new PayPalProductionError(
      "PayPal currency must be a three-letter uppercase code."
    );
  }
}

async function paypalRequest(
  endpoint,
  {
    method = "GET",
    body,
    requestId
  } = {}
) {
  const accessToken =
    await getAccessToken();

  const headers = {
    Authorization:
      `Bearer ${accessToken}`,

    Accept:
      "application/json",

    "Content-Type":
      "application/json"
  };

  if (requestId) {
    headers["PayPal-Request-Id"] =
      requestId;
  }

  const response = await fetch(
    `${PAYPAL_LIVE_BASE_URL}${endpoint}`,
    {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body)
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new PayPalProductionError(
      "PayPal production API request failed.",
      {
        status: response.status,
        endpoint,
        paypalDebugId:
          response.headers.get(
            "paypal-debug-id"
          ) || null,

        providerResponse:
          data
      }
    );
  }

  return {
    status: response.status,

    paypalDebugId:
      response.headers.get(
        "paypal-debug-id"
      ) || null,

    data
  };
}

async function createOrder({
  amount,
  currency,
  referenceId,
  description,
  idempotencyKey
}) {
  validateAmount({
    amount,
    currency
  });

  if (!idempotencyKey) {
    throw new PayPalProductionError(
      "An idempotency key is required."
    );
  }

  const purchaseUnit = {
    amount: {
      currency_code:
        currency,

      value:
        amount
    }
  };

  if (referenceId) {
    purchaseUnit.reference_id =
      String(referenceId).slice(
        0,
        256
      );
  }

  if (description) {
    purchaseUnit.description =
      String(description).slice(
        0,
        127
      );
  }

  const result =
    await paypalRequest(
      "/v2/checkout/orders",
      {
        method: "POST",

        requestId:
          idempotencyKey,

        body: {
          intent: "CAPTURE",

          purchase_units: [
            purchaseUnit
          ]
        }
      }
    );

  return {
    provider:
      "paypal",

    environment:
      "production",

    providerOrderId:
      result.data.id,

    providerStatus:
      result.data.status,

    approvalUrl:
      Array.isArray(
        result.data.links
      )
        ? (
            result.data.links.find(
              link =>
                link.rel ===
                "payer-action" ||
                link.rel ===
                "approve"
            )?.href || null
          )
        : null,

    providerConfirmed:
      false,

    settlementExecuted:
      false,

    paypalDebugId:
      result.paypalDebugId
  };
}

async function getOrder(
  providerOrderId
) {
  if (!providerOrderId) {
    throw new PayPalProductionError(
      "PayPal order ID is required."
    );
  }

  const result =
    await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(
        providerOrderId
      )}`
    );

  return {
    provider:
      "paypal",

    environment:
      "production",

    providerOrderId:
      result.data.id,

    providerStatus:
      result.data.status,

    providerConfirmed:
      result.data.status ===
      "COMPLETED",

    data:
      result.data,

    paypalDebugId:
      result.paypalDebugId
  };
}

async function captureOrder({
  providerOrderId,
  idempotencyKey
}) {
  if (!providerOrderId) {
    throw new PayPalProductionError(
      "PayPal order ID is required."
    );
  }

  if (!idempotencyKey) {
    throw new PayPalProductionError(
      "An idempotency key is required."
    );
  }

  const result =
    await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(
        providerOrderId
      )}/capture`,
      {
        method: "POST",

        requestId:
          idempotencyKey,

        body: {}
      }
    );

  const completed =
    result.data.status ===
    "COMPLETED";

  return {
    provider:
      "paypal",

    environment:
      "production",

    providerOrderId:
      result.data.id,

    providerStatus:
      result.data.status,

    providerConfirmed:
      completed,

    settlementExecuted:
      completed,

    paypalDebugId:
      result.paypalDebugId,

    providerReceiptDigest:
      crypto
        .createHash("sha256")
        .update(
          JSON.stringify(
            result.data
          )
        )
        .digest("hex"),

    data:
      result.data
  };
}

function configurationStatus() {
  return {
    provider:
      "paypal",

    environment:
      "production",

    liveBaseUrl:
      PAYPAL_LIVE_BASE_URL,

    clientIdConfigured:
      Boolean(
        process.env.PAYPAL_CLIENT_ID
      ),

    clientSecretConfigured:
      Boolean(
        process.env
          .PAYPAL_CLIENT_SECRET
      ),

    credentialsExposed:
      false
  };
}

module.exports = {
  PayPalProductionError,
  configurationStatus,
  createOrder,
  getOrder,
  captureOrder
};
