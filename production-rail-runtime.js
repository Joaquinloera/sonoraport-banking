"use strict";

/*
 * SONORAPORT BANKING
 * Production Rail Runtime
 *
 * Purpose:
 * - Central production-rail registry
 * - Environment/configuration inspection
 * - Server-side runtime gating
 * - No credentials or secret values are stored here
 */

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
    id: "paypal",
    name: "PayPal",
    enabled: true,
    mode: "production",
    adapter: "paypal-production-adapter.js",
    upstreamProvider: "paypal"
  }),

  visa: Object.freeze({
    id: "visa",
    name: "Visa Debit",
    enabled: true,
    mode: "production",
    adapter:
      "netlify/functions/lib/card-issuer-router.mjs",
    upstreamProvider: "visa"
  }),

  venmo: Object.freeze({
    id: "venmo",
    name: "Venmo",
    enabled: true,
    mode: "production",
    adapter: null,
    upstreamProvider: "paypal"
  }),

  cashapp: Object.freeze({
    id: "cashapp",
    name: "Cash App",
    enabled: true,
    mode: "production",
    adapter: null,
    upstreamProvider: "cashapp"
  }),

  zelle: Object.freeze({
    id: "zelle",
    name: "Zelle",
    enabled: true,
    mode: "production",
    adapter: null,
    upstreamProvider: "authorized-partner",
    provisioning: "authorized-partner"
  })
});

function configured(name) {
  const value = process.env[name];

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  const placeholders = new Set([
    "CONFIGURE_IN_NETLIFY",
    "SET_IN_NETLIFY_NOT_GITHUB",
    "CHANGE_ME",
    "REPLACE_ME",
    "TODO"
  ]);

  return !placeholders.has(normalized);
}

function environmentStatus(names = []) {
  const required = [...names];

  const present = required.filter(
    name => configured(name)
  );

  const missing = required.filter(
    name => !configured(name)
  );

  return {
    required,
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
      authenticated: false,
      providerVerified: false,
      settlementVerified: false,
      state: "UNKNOWN_RAIL",
      credentialsExposed: false
    };
  }

  const environment =
    environmentStatus(
      REQUIRED_ENVIRONMENT[provider] || []
    );

  let state = "ENABLED";

  if (!environment.configured) {
    state =
      "ENABLED_AWAITING_CONFIGURATION";
  } else if (!configuration.adapter) {
    state =
      "CONFIGURED_AWAITING_ADAPTER";
  } else {
    state =
      "CONFIGURED_AWAITING_PROVIDER_VERIFICATION";
  }

  return {
    provider:
      configuration.id,

    name:
      configuration.name,

    enabled:
      configuration.enabled === true,

    mode:
      configuration.mode,

    adapter:
      configuration.adapter,

    upstreamProvider:
      configuration.upstreamProvider,

    provisioning:
      configuration.provisioning || null,

    configured:
      environment.configured,

    environment,

    authenticated: false,

    providerVerified: false,

    settlementVerified: false,

    state,

    credentialsExposed: false
  };
}

function allStatuses() {
  return Object.keys(
    RAIL_CONFIGURATION
  ).map(provider =>
    railStatus(provider)
  );
}

function productionRailSummary() {
  const rails = allStatuses();

  return {
    service:
      "SONORAPORT_BANKING",

    environment:
      "production",

    realMoneyTarget:
      true,

    moneyMovementTarget:
      "OPEN_ENABLED",

    credentialsStoredInRepository:
      false,

    rails,

    totals: {
      registered:
        rails.length,

      enabled:
        rails.filter(
          rail => rail.enabled
        ).length,

      configured:
        rails.filter(
          rail => rail.configured
        ).length,

      authenticated:
        rails.filter(
          rail => rail.authenticated
        ).length,

      providerVerified:
        rails.filter(
          rail =>
            rail.providerVerified
        ).length,

      settlementVerified:
        rails.filter(
          rail =>
            rail.settlementVerified
        ).length
    }
  };
}

function assertRailEnabled(provider) {
  const status =
    railStatus(provider);

  if (!status.enabled) {
    const error = new Error(
      `Production rail is not enabled: ${provider}`
    );

    error.code =
      "PRODUCTION_RAIL_NOT_ENABLED";

    error.provider =
      provider;

    throw error;
  }

  return status;
}

function assertRailConfigured(provider) {
  const status =
    assertRailEnabled(provider);

  if (!status.configured) {
    const error = new Error(
      `Production rail configuration incomplete: ${provider}`
    );

    error.code =
      "PRODUCTION_RAIL_NOT_CONFIGURED";

    error.provider =
      provider;

    error.missingEnvironmentVariables =
      status.environment.missing;

    throw error;
  }

  return status;
}

function assertRailAdapterPresent(provider) {
  const status =
    assertRailConfigured(provider);

  if (!status.adapter) {
    const error = new Error(
      `Production rail adapter is not implemented: ${provider}`
    );

    error.code =
      "PRODUCTION_RAIL_ADAPTER_NOT_IMPLEMENTED";

    error.provider =
      provider;

    throw error;
  }

  return status;
}

function publicRailStatus(provider) {
  const status =
    railStatus(provider);

  return {
    provider:
      status.provider,

    name:
      status.name || null,

    enabled:
      status.enabled,

    mode:
      status.mode || null,

    configured:
      status.configured,

    authenticated:
      status.authenticated,

    providerVerified:
      status.providerVerified,

    settlementVerified:
      status.settlementVerified,

    state:
      status.state,

    upstreamProvider:
      status.upstreamProvider || null,

    provisioning:
      status.provisioning || null
  };
}

function publicRailSummary() {
  const summary =
    productionRailSummary();

  return {
    service:
      summary.service,

    environment:
      summary.environment,

    realMoneyTarget:
      summary.realMoneyTarget,

    moneyMovementTarget:
      summary.moneyMovementTarget,

    rails:
      summary.rails.map(
        rail =>
          publicRailStatus(
            rail.provider
          )
      ),

    totals:
      summary.totals
  };
}

module.exports = {
  REQUIRED_ENVIRONMENT,
  RAIL_CONFIGURATION,

  configured,
  environmentStatus,

  railStatus,
  allStatuses,

  productionRailSummary,
  publicRailStatus,
  publicRailSummary,

  assertRailEnabled,
  assertRailConfigured,
  assertRailAdapterPresent
};
