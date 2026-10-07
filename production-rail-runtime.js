"use strict";

const REQUIRED_ENVIRONMENT = Object.freeze({
  paypal: Object.freeze([
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET"
  ]),

  visa: Object.freeze([
    "VISA_API_KEY",
    "VISA_SHARED_SECRET",
    "VISA_CLIENT_CERT_PATH",
    "VISA_PRIVATE_KEY_PATH",
    "CARD_ISSUER_NAME",
    "CARD_ISSUER_PRIORITY",
    "CARD_ISSUER_TIMEOUT_MS",
    "CARD_ISSUER_WEBHOOK_SECRET"
  ]),

  venmo: Object.freeze([
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET"
  ]),

  cashapp: Object.freeze([
    "CASH_APP_CLIENT_ID",
    "CASH_APP_CLIENT_SECRET"
  ]),

  zelle: Object.freeze([
    "ZELLE_PARTNER_ID",
    "ZELLE_API_BASE_URL"
  ])
});

const RAIL_CONFIGURATION = Object.freeze({
  paypal: Object.freeze({
    enabled: true,
    mode: "production",
    adapter: "paypal-production-adapter.js"
  }),

  visa: Object.freeze({
    enabled: true,
    mode: "production",
    adapter: "netlify/functions/lib/card-issuer-router.mjs"
  }),

  venmo: Object.freeze({
    enabled: true,
    mode: "production",
    provider: "paypal"
  }),

  cashapp: Object.freeze({
    enabled: true,
    mode: "production"
  }),

  zelle: Object.freeze({
    enabled: true,
    mode: "production",
    provisioning: "authorized-partner"
  })
});

function configured(name) {
  const value = process.env[name];

  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value !== "CONFIGURE_IN_NETLIFY" &&
    value !== "SET_IN_NETLIFY_NOT_GITHUB"
  );
}

function environmentStatus(names) {
  const present = names.filter(configured);

  const missing = names.filter(
    name => !configured(name)
  );

  return {
    required: [...names],
    present,
    missing,
    configured: missing.length === 0
  };
}

function railStatus(provider) {
  const configuration =
    RAIL_CONFIGURATION[provider];

  if (!configuration) {
    return {
      provider,
      enabled: false,
      configured: false,
      state: "UNKNOWN_RAIL"
    };
  }

  const environment =
    environmentStatus(
      REQUIRED_ENVIRONMENT[provider] || []
    );

  return {
    provider,
    enabled:
      configuration.enabled === true,

    mode:
      configuration.mode,

    adapter:
      configuration.adapter || null,

    upstreamProvider:
      configuration.provider || null,

    provisioning:
      configuration.provisioning || null,

    configured:
      environment.configured,

    environment,

    authenticated: false,
    providerVerified: false,
    settlementVerified: false,

    credentialsExposed: false
  };
}

function allStatuses() {
  return Object.keys(
    RAIL_CONFIGURATION
  ).map(railStatus);
}

function productionRailSummary() {
  const rails = allStatuses();

  return {
    environment: "production",

    realMoneyTarget: true,

    rails,

    totals: {
      registered: rails.length,

      enabled:
        rails.filter(
          rail => rail.enabled
        ).length,

      configured:
        rails.filter(
          rail => rail.configured
        ).length,

      providerVerified:
        rails.filter(
          rail =>
            rail.providerVerified
        ).length
    }
  };
}

function assertRailEnabled(provider) {
  const status = railStatus(provider);

  if (!status.enabled) {
    const error = new Error(
      `Production rail is not enabled: ${provider}`
    );

    error.code =
      "PRODUCTION_RAIL_NOT_ENABLED";

    throw error;
  }

 
