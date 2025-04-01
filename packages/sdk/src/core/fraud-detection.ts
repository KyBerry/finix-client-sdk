import { Environment } from "./types";

/**
 * Declares the global _sift array for TypeScript
 */
declare global {
  interface Window {
    _sift: any[];
  }
}

/**
 * Determines if we're in a browser environment
 */
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Handles fraud detection integration with Sift Science
 * This is critical for securing payments and preventing fraud
 */
export class FraudDetection {
  /**
   * Create a fraud detection session and initialize Sift Science
   * @param merchantId The merchant identifier
   * @param environment The Finix environment
   * @returns A promise that resolves with the session ID
   */
  public static async setup(merchantId: string, environment: Environment.Type): Promise<string> {
    // Skip API call in server environment
    if (!isBrowser) {
      return "ssr-placeholder";
    }

    try {
      // 1. Create a session
      const sessionId = await this.createSession(merchantId, environment);

      // 2. Get the beacon key
      const beaconKey = Environment.BeaconKeys[environment];

      // 3. Initialize Sift Science with the session
      await this.initializeSift(sessionId, beaconKey);

      // 4. Return the session ID for later use
      return sessionId;
    } catch (error) {
      console.warn("Error during fraud detection setup", error);

      // Generate a fallback session ID
      const fallbackSessionId = `session-${Date.now()}-${Math.random()}`;

      // Try to initialize with fallback values
      try {
        const beaconKey = Environment.BeaconKeys[environment];
        await this.initializeSift(fallbackSessionId, beaconKey);
      } catch (initError) {
        console.warn("Failed to initialize Sift with fallback values", initError);
      }

      return fallbackSessionId;
    }
  }

  /**
   * Private method to initialize Sift Science with the given session
   */
  private static async initializeSift(sessionId: string, beaconKey: string): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        // Initialize the _sift array if it doesn't exist
        const _sift = (window._sift = window._sift || []);

        // Configure Sift with our account and session
        _sift.push(["_setAccount", beaconKey]);
        _sift.push(["_setSessionId", sessionId]);
        _sift.push(["_trackPageview"]);

        // Create and load the Sift script
        const script = document.createElement("script");
        script.src = "https://cdn.sift.com/s.js";
        script.async = true;

        // Handle script load/error events
        script.onload = () => {
          resolve();
        };

        script.onerror = () => {
          console.warn("Failed to load Sift Science script");
          resolve();
        };

        // Add the script to the document
        document.body.appendChild(script);
      } catch (error) {
        console.warn("Error initializing Sift Science:", error);
        resolve();
      }
    });
  }

  /**
   * Private method to create a session with the Finix fraud detection service
   */
  private static async createSession(merchantId: string, environment: Environment.Type): Promise<string> {
    // Get the API URL for the current environment
    const apiUrl = Environment.ApiUrls[environment];

    // Make the API call to create a session
    const response = await fetch(`${apiUrl}/fraud/sessions?merchant_id=${encodeURIComponent(merchantId)}`);

    if (!response.ok) {
      throw new Error(`Failed to create fraud session: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract the session ID
    const sessionId = data.session_id;

    if (!sessionId) {
      throw new Error("Missing session ID in response");
    }

    return sessionId;
  }
}
