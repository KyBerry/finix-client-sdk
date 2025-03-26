import { FinixCoreConfigSchema } from "@/core/schemas";

import { DEFAULT_CONFIG, DEFAULT_API_URLS, DEFAULT_BEACON_KEYS } from "@/internal/constants";

import type { FinixCoreConfig } from "@/types";

export class FinixConfigManager {
  private config: FinixCoreConfig;

  constructor(userConfig: Partial<FinixCoreConfig>) {
    try {
      this.config = FinixCoreConfigSchema.parse({
        ...DEFAULT_CONFIG,
        ...userConfig,
      });
    } catch (error) {
      // TODO: Create a custom error class for configuration errors
      throw new Error(`Invalid configuration: ${error}`);
    }
  }

  /** Returns a deep copy of the current configuration to prevent accidental mutation */
  public getConfig() {
    return Object.freeze(this.config);
  }

  /** Returns the API URL for the current environment */
  public getApiUrl() {
    const { environment } = this.config;
    return DEFAULT_API_URLS[environment];
  }

  /** Returns the default Sift beacon key for the current environment */
  public getDefaultSiftBeaconKey() {
    const { environment } = this.config;
    return DEFAULT_BEACON_KEYS[environment];
  }

  /** Returns the application ID for the current configuration */
  public getApplicationId() {
    return this.config.applicationId;
  }

  /** Returns the merchant ID for the current configuration */
  public getMerchantId() {
    return this.config.merchantId;
  }
}
