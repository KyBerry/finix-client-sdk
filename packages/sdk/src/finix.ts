enum FINIX_ENVIRONMENT {
  QA = "qa",
  SANDBOX = "sandbox",
  LIVE = "live",
  PROD = "prod",
}

enum SIFT_BEACON_KEY {
  QA_SANDBOX = "523dfab8f5",
  LIVE_PROD = "4ceeab9947",
}

/**
 * Status of the Finix SDK initialization
 */
enum InitializationStatus {
  NOT_STARTED = "not_started",
  INITIALIZING = "initializing",
  READY = "ready",
  FAILED = "failed",
}

const DEFAULT_BEACON_KEYS: Record<FINIX_ENVIRONMENT, string> = {
  [FINIX_ENVIRONMENT.QA]: SIFT_BEACON_KEY.QA_SANDBOX,
  [FINIX_ENVIRONMENT.SANDBOX]: SIFT_BEACON_KEY.QA_SANDBOX,
  [FINIX_ENVIRONMENT.LIVE]: SIFT_BEACON_KEY.LIVE_PROD,
  [FINIX_ENVIRONMENT.PROD]: SIFT_BEACON_KEY.LIVE_PROD,
};

const DEFAULT_API_URLS: Record<FINIX_ENVIRONMENT, string> = {
  [FINIX_ENVIRONMENT.QA]: "https://finix.qa-payments-api.com",
  [FINIX_ENVIRONMENT.SANDBOX]: "https://finix.sandbox-payments-api.com",
  [FINIX_ENVIRONMENT.LIVE]: "https://finix.live-payments-api.com",
  [FINIX_ENVIRONMENT.PROD]: "https://finix.live-payments-api.com",
};

class Finix {
  private applicationId: string;
  private environment: FINIX_ENVIRONMENT;
  private initializePromise: Promise<string> | null = null;
  private merchantId: string;
  private sessionKey: string | null = null;
  private siftBeaconKey: string | null = null;
  private status: InitializationStatus = InitializationStatus.NOT_STARTED;

  constructor(applicationId: string = "", environment: FINIX_ENVIRONMENT = FINIX_ENVIRONMENT.SANDBOX, merchantId: string = "") {
    this.applicationId = applicationId;
    this.environment = environment;
    this.merchantId = merchantId;
  }

  /**
   * Initializes the Finix SDK
   * @returns A promise that resolves with the session key when initialization is finished
   */
  async initialize(): Promise<string> {
    // If already initializing, return the existing promise
    if (this.initializePromise) return this.initializePromise;

    this.status = InitializationStatus.INITIALIZING;

    // Create and store the initialization promise
    this.initializePromise = this.setupFinix();

    try {
      // Wait for initialization to complete
      const sessionKey = await this.initializePromise;

      this.status = InitializationStatus.READY;

      return sessionKey;
    } catch (error) {
      this.status = InitializationStatus.FAILED;
      // Invalidate the failed promise so we can try again
      this.initializePromise = null;
      throw error;
    }
  }

  /**
   * Core setup logic for Finix and fraud detection
   * @returns A promise that resolves with the session key
   */
  private async setupFinix(): Promise<string> {
    try {
      // Get the API URL based on the environment
      const apiUrl = this.getApiUrl();

      // Make API call to get a session key and Sift beacon key
      const response = await fetch(`${apiUrl}/fraud/sessions?merchant_id=${this.merchantId}`);

      if (!response.ok) {
        throw new Error(`Failed to initialize fraud session: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract session and beacon keys
      this.sessionKey = data?.session_id;
      this.siftBeaconKey = data?.sift_beacon_key;

      if (!this.sessionKey || !this.siftBeaconKey) {
        throw new Error("Missing session key or beacon key in response");
      }

      // Initialize Sift Science with the obtained keys
      await this.setupSift(this.sessionKey, this.siftBeaconKey);

      return this.sessionKey;
    } catch (error) {
      console.warn("Error initializing Finix fraud detection, using fallback values", error);

      // Generate fallback session key
      this.sessionKey = `session-key-${Date.now()}-${Math.random()}`;

      // Use default beacon key for the environment from our mapping
      this.siftBeaconKey = this.getDefaultBeaconKey();

      // Initialize Sift with fallback values
      await this.setupSift(this.sessionKey, this.siftBeaconKey);

      return this.sessionKey;
    }
  }

  /**
   * Initializes the Sift Science fraud detection library
   * @param sessionId Unique identifier for the current session
   * @param beaconKey Sift Science account identifier key
   * @returns A promise that resolves when initialization is complete
   */
  private async setupSift(sessionId: string, beaconKey: string): Promise<void> {
    return new Promise<void>((resolve) => {
      // Get or initialize the _sift array
      const _sift = (window._sift = window._sift || []);

      // Push configuration commands to the Sift queue
      _sift.push(["_setAccount", beaconKey], ["_setSessionId", sessionId], ["_trackPageview"]);

      // Create script element to load the Sift library
      const script = document.createElement("script");
      script.src = "https://cdn.sift.com/s.js";

      // Resolve the promise when the script loads
      script.onload = () => resolve();

      // Handle errors
      script.onerror = (error) => {
        console.error(error);
        resolve();
      };

      // Append the script to the document body
      document.body.appendChild(script);
    });
  }

  /**
   * Gets the current session key for fraud detection
   * @returns The current session key
   * @throws If the SDK hasn't been initialized
   */
  getSessionKey(): string {
    if (!this.sessionKey) {
      throw new Error("Finix SDK not initialized. Call initialize() first.");
    }
    return this.sessionKey;
  }

  /**
   * Returns the API URL for the current environment
   * @returns The API base URL
   */
  private getApiUrl(): string {
    return DEFAULT_API_URLS[this.environment];
  }

  /**
   * Gets the appropriate default beacon key for the current environment
   * @returns The default beacon key for this environment
   */
  private getDefaultBeaconKey(): string {
    return DEFAULT_BEACON_KEYS[this.environment];
  }
}

declare global {
  interface Window {
    _sift: any[];
    Finix: any;
  }
}
