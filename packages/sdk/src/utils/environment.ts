import { FINIX_ENVIRONMENT, API_URLS, BEACON_KEYS, IFRAME_URL } from "@/types";

/**
 * Get environment-specific configuration values
 */
export function getEnvironmentConfig(environment: FINIX_ENVIRONMENT) {
  return {
    apiUrl: API_URLS[environment],
    beaconKey: BEACON_KEYS[environment],
    iframeUrl: IFRAME_URL,
  };
}
