export const FINIX_ENVIRONMENT = {
  QA: "qa",
  SANDBOX: "sandbox",
  LIVE: "live",
  PROD: "prod",
} as const;

export const API_URLS = {
  [FINIX_ENVIRONMENT.QA]: "https://finix.qa-payments-api.com",
  [FINIX_ENVIRONMENT.SANDBOX]: "https://finix.sandbox-payments-api.com",
  [FINIX_ENVIRONMENT.LIVE]: "https://finix.live-payments-api.com",
  [FINIX_ENVIRONMENT.PROD]: "https://finix.live-payments-api.com",
} as const;

export const BEACON_KEYS = {
  [FINIX_ENVIRONMENT.QA]: "523dfab8f5",
  [FINIX_ENVIRONMENT.SANDBOX]: "523dfab8f5",
  [FINIX_ENVIRONMENT.LIVE]: "4ceeab9947",
  [FINIX_ENVIRONMENT.PROD]: "4ceeab9947",
} as const;

export const IFRAME_URL = "https://js.finix.com/v/1/payment-fields/index.html?" as const;
