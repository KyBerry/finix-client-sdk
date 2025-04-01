import { Environment, TokenId, FormError } from "./types";

/**
 * Response from a tokenization request
 */
interface TokenizationResponse {
  readonly id: TokenId;
  readonly created_at: string;
  readonly updated_at: string;
  readonly application: string;
  readonly [key: string]: unknown;
}

/**
 * Error response from a failed tokenization request
 */
interface TokenizationErrorResponse {
  readonly error: {
    readonly message: string;
    readonly code: string;
    readonly status?: number;
    readonly details?: unknown;
  };
}

/**
 * Handles secure payment instrument tokenization
 */
export class TokenizationService {
  private readonly applicationId: string;
  private readonly apiBaseUrl: string;
  private readonly sessionKey: string;

  /**
   * Create a new tokenization service
   * @param environment Finix environment
   * @param sessionKey Session key for fraud detection
   */
  constructor(applicationId: string, environment: Environment.Type, sessionKey: string) {
    this.applicationId = applicationId;
    this.apiBaseUrl = Environment.ApiUrls[environment];
    this.sessionKey = sessionKey;
  }

  /**
   * Tokenize payment data
   * @param paymentData Payment data to tokenize
   * @param applicationId Application ID
   * @returns A promise that resolves with the token ID
   * @throws Error if tokenization fails
   */
  public async tokenize(paymentData: Record<string, unknown>): Promise<TokenId> {
    try {
      // Prepare the request payload
      const payload = {
        application: this.applicationId,
        fraud_session_id: this.sessionKey,
        ...paymentData,
      };

      // Make the API request
      const response = await fetch(`${this.apiBaseUrl}/payment_instruments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Parse the response data
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        const errorData = data as TokenizationErrorResponse;
        throw this.formatError(errorData, response.status);
      }

      // Return the token ID on success
      const tokenData = data as TokenizationResponse;
      return tokenData.id;
    } catch (error) {
      // Rethrow the error with additional context
      if (error instanceof Error) {
        throw error;
      }

      // Handle unexpected errors
      throw new Error("Tokenization failed: Unknown error");
    }
  }

  /**
   * Format an error response into a consistent error object
   * @param errorResponse Error response from the API
   * @param status HTTP status code
   * @returns Formatted error object
   */
  private formatError(errorResponse: TokenizationErrorResponse, status: number): FormError {
    const { error } = errorResponse;

    return {
      code: error.code || `ERROR_${status}`,
      message: error.message || "An unknown error occurred during tokenization",
      details: error.details,
    };
  }
}
