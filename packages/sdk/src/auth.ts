import { FinixSdkError } from "./errors";
import { DEFAULT_FORM_READY_TIMEOUT_MS, withAsyncControls } from "./internal/async";
import { isNativeFinixAuth, type NativeFinixAuth } from "./internal/native";
import { loadFinix } from "./loader";
import type { FinixAsyncOptions, FinixAuthConfig } from "./types";
import { assertMerchantId, validateAuthConfig } from "./validation";

/** Promise-based wrapper around the documented Finix.Auth session API. */
export class FinixAuthSession {
  readonly #native: NativeFinixAuth;
  #sessionKey: string;
  #nativeKeySnapshot: string | undefined;

  /** @internal Instances are created by createFinixAuth(). */
  public constructor(native: NativeFinixAuth, sessionKey: string) {
    this.#native = native;
    this.#sessionKey = sessionKey;
    this.#nativeKeySnapshot = native.getSessionKey();
  }

  public getSessionKey(): string {
    const current = this.#native.getSessionKey();
    if (typeof current === "string" && current.length > 0 && current !== this.#nativeKeySnapshot) {
      this.#sessionKey = current;
      this.#nativeKeySnapshot = current;
    }
    return this.#sessionKey;
  }

  public async connect(merchantId: string, options: FinixAsyncOptions = {}): Promise<string> {
    assertMerchantId(merchantId);
    const connection = new Promise<string>((resolve, reject) => {
      try {
        this.#native.connect(merchantId, (sessionKey) => {
          if (typeof sessionKey !== "string" || sessionKey.length === 0) {
            reject(new FinixSdkError("invalid_response", "Finix.Auth.connect returned an invalid session key."));
            return;
          }
          this.#sessionKey = sessionKey;
          this.#nativeKeySnapshot = this.#native.getSessionKey();
          resolve(sessionKey);
        });
      } catch (error: unknown) {
        reject(FinixSdkError.from(error, "auth_unavailable", "Finix.Auth.connect failed."));
      }
    });

    return withAsyncControls(connection, options, DEFAULT_FORM_READY_TIMEOUT_MS, "Finix Auth merchant connection");
  }
}

export async function createFinixAuth(config: FinixAuthConfig, options: FinixAsyncOptions = {}): Promise<FinixAuthSession> {
  validateAuthConfig(config);
  const finix = await loadFinix({ ...config.script, signal: options.signal });
  if (typeof finix.Auth !== "function") {
    throw new FinixSdkError(
      "auth_unavailable",
      "This Finix.js build does not expose the documented Finix.Auth API.",
    );
  }

  let native: NativeFinixAuth | undefined;
  let resolveKey: ((sessionKey: string) => void) | undefined;
  let rejectKey: ((error: FinixSdkError) => void) | undefined;
  const ready = new Promise<string>((resolve, reject) => {
    resolveKey = resolve;
    rejectKey = reject;
  });

  try {
    native = finix.Auth(config.environment, config.merchantId, (sessionKey) => {
      if (typeof sessionKey !== "string" || sessionKey.length === 0) {
        rejectKey?.(new FinixSdkError("invalid_response", "Finix.Auth returned an invalid session key."));
        return;
      }
      resolveKey?.(sessionKey);
    });
    if (!isNativeFinixAuth(native)) {
      throw new FinixSdkError("auth_unavailable", "Finix.Auth did not return an Auth instance.");
    }
    const immediateKey = native.getSessionKey();
    if (typeof immediateKey === "string" && immediateKey.length > 0) {
      resolveKey?.(immediateKey);
    }
    const sessionKey = await withAsyncControls(
      ready,
      options,
      config.readyTimeoutMs ?? DEFAULT_FORM_READY_TIMEOUT_MS,
      "Finix Auth initialization",
    );
    return new FinixAuthSession(native, sessionKey);
  } catch (error: unknown) {
    const normalized = FinixSdkError.from(error, "auth_unavailable", "Finix.Auth initialization failed.");
    throw normalized;
  }
}
