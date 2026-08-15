import { FinixSdkError } from "./errors";
import { DEFAULT_SCRIPT_TIMEOUT_MS, withAsyncControls } from "./internal/async";
import { isFinixGlobal, type FinixGlobal } from "./internal/native";
import type { LoadFinixOptions } from "./types";

export const FINIX_SCRIPT_URL = "https://js.finix.com/v/2/finix.js";

let sharedLoad: Promise<FinixGlobal> | undefined;

function getLoadedFinix(): FinixGlobal | undefined {
  if (window.Finix === undefined) {
    return undefined;
  }

  if (!isFinixGlobal(window.Finix)) {
    throw new FinixSdkError("script_conflict", "window.Finix exists but is not the Finix v2 API.");
  }

  return window.Finix;
}

function findExistingScript(): HTMLScriptElement | undefined {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]"));
  const exact = scripts.find((script) => script.src === FINIX_SCRIPT_URL);
  const conflict = scripts.find((script) => {
    try {
      return new URL(script.src, document.baseURI).hostname === "js.finix.com" && script.src !== FINIX_SCRIPT_URL;
    } catch {
      return false;
    }
  });

  if (conflict) {
    throw new FinixSdkError("script_conflict", `A different Finix script is already present: ${conflict.src}`);
  }

  return exact;
}

function beginLoad(options: LoadFinixOptions): Promise<FinixGlobal> {
  const loaded = getLoadedFinix();
  if (loaded) {
    return Promise.resolve(loaded);
  }

  const existing = findExistingScript();
  const script = existing ?? document.createElement("script");

  return new Promise<FinixGlobal>((resolve, reject) => {
    const cleanup = (): void => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
    const handleLoad = (): void => {
      cleanup();
      try {
        const finix = getLoadedFinix();
        if (!finix) {
          reject(new FinixSdkError("finix_unavailable", "Finix v2 loaded without installing window.Finix."));
          return;
        }
        resolve(finix);
      } catch (error: unknown) {
        reject(error);
      }
    };
    const handleError = (): void => {
      cleanup();
      if (!existing) {
        script.remove();
      }
      reject(new FinixSdkError("script_load_failed", `Failed to load ${FINIX_SCRIPT_URL}.`));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.src = FINIX_SCRIPT_URL;
      script.async = true;
      script.dataset.finixSdk = "v2";
      if (options.nonce !== undefined) {
        script.nonce = options.nonce;
      }
      document.head.append(script);
    }
  });
}

/** Loads Finix's official hosted v2 script without bundling or mirroring it. */
export function loadFinix(options: LoadFinixOptions = {}): Promise<FinixGlobal> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new FinixSdkError("not_browser", "Finix.js can only be loaded in a browser."));
  }

  try {
    const loaded = getLoadedFinix();
    if (loaded) {
      return Promise.resolve(loaded);
    }

    if (!sharedLoad) {
      // A caller's shorter timeout or abort must not cancel the shared network
      // load for other consumers. The shared operation keeps its own ceiling.
      const underlying = withAsyncControls(beginLoad(options), undefined, DEFAULT_SCRIPT_TIMEOUT_MS, "Finix script load");
      sharedLoad = underlying.catch((error: unknown) => {
        document.querySelector<HTMLScriptElement>('script[data-finix-sdk="v2"]')?.remove();
        sharedLoad = undefined;
        throw error;
      });
    }

    return withAsyncControls(sharedLoad, { signal: options.signal, timeoutMs: options.timeoutMs }, DEFAULT_SCRIPT_TIMEOUT_MS, "Finix script load");
  } catch (error: unknown) {
    return Promise.reject(error);
  }
}
