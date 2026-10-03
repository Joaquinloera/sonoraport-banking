const REQUIRED_VISA_ENV = Object.freeze([
  "VISA_API_KEY",
  "VISA_SHARED_SECRET",
  "VISA_CLIENT_CERT_PATH",
  "VISA_PRIVATE_KEY_PATH"
]);

const REQUIRED_ISSUER_ENV = Object.freeze([
  "CARD_ISSUER_NAME",
  "CARD_ISSUER_PRIORITY",
  "CARD_ISSUER_TIMEOUT_MS",
  "CARD_ISSUER_WEBHOOK_SECRET"
]);

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
  const missing = names.filter(name => !configured(name));

  return {
    required: names,
    present,
    missing,
    configured: missing.length === 0
  };
}

export function visaIssuerConfigurationStatus() {
  const visa = environmentStatus(REQUIRED_VISA_ENV);
  const issuer = environmentStatus(REQUIRED_ISSUER_ENV);

  return {
    provider: "visa",
    environment: "production",
    visa,
    issuer,
    configured: visa.configured && issuer.configured,
    authenticated: false,
    providerVerified: false,
    credentialsExposed: false
  };
}

export function assertVisaIssuerConfigured() {
  const status = visaIssuerConfigurationStatus();

  if (!status.configured) {
    const missing = [
      ...status.visa.missing,
      ...status.issuer.missing
    ];

    const error = new Error(
      `Visa issuer configuration incomplete: ${missing.join(", ")}`
    );

    error.code = "VISA_ISSUER_NOT_CONFIGURED";
    error.missingEnvironmentVariables = missing;

    throw error;
  }

  return status;
}

export function visaIssuerRuntimeGate() {
  const status = visaIssuerConfigurationStatus();

  if (!status.configured) {
    return {
      allowed: false,
      state: "BLOCKED",
      reason: "CONFIGURATION_INCOMPLETE",
      missingEnvironmentVariables: [
        ...status.visa.missing,
        ...status.issuer.missing
      ]
    };
  }

  return {
    allowed: false,
    state: "AWAITING_PROVIDER_IMPLEMENTATION",
    reason:
      "Environment configuration does not prove Visa authentication or provider connectivity."
  };
}

export const VISA_ISSUER_SECURITY = Object.freeze({
  secretsReturned: false,
  rawPanAccepted: false,
  cvvPersisted: false,
  pinPersisted: false,
  providerVerificationRequired: true,
  fabricatedApprovalAllowed: false,
  unverifiedSettlementAllowed: false
});
