import { afterEach, describe, expect, it, vi } from "vitest";

interface StubFinixGlobal {
  PaymentForm: () => { submit: () => void };
}

function createFinixGlobal(): StubFinixGlobal {
  return {
    PaymentForm: () => ({ submit: () => undefined }),
  };
}

function removeFinixGlobals(): void {
  Reflect.deleteProperty(window, "Finix");
  document.querySelectorAll("script[src*='js.finix.com']").forEach((script) => script.remove());
}

async function loadFreshModule(): Promise<typeof import("../loader")> {
  vi.resetModules();
  return import("../loader");
}

afterEach(() => {
  vi.useRealTimers();
  removeFinixGlobals();
});

describe("loadFinix", () => {
  it("returns an existing valid v2 global without adding a script", async () => {
    const runtime = createFinixGlobal();
    Reflect.set(window, "Finix", runtime);
    const { loadFinix } = await loadFreshModule();

    await expect(loadFinix()).resolves.toBe(runtime);
    expect(document.querySelector("script[src*='js.finix.com']")).toBeNull();
  });

  it("rejects a conflicting window.Finix value", async () => {
    Reflect.set(window, "Finix", { PaymentForm: "not-a-function" });
    const { loadFinix } = await loadFreshModule();

    await expect(loadFinix()).rejects.toMatchObject({ code: "script_conflict" });
  });

  it("loads only the official hosted v2 script and applies a CSP nonce", async () => {
    const { FINIX_SCRIPT_URL, loadFinix } = await loadFreshModule();
    const pending = loadFinix({ nonce: "request-nonce", timeoutMs: 1_000 });
    const script = document.querySelector("script[data-finix-sdk='v2']");

    expect(script).toBeInstanceOf(HTMLScriptElement);
    if (!(script instanceof HTMLScriptElement)) {
      throw new Error("Expected the Finix script element to exist.");
    }

    expect(script.src).toBe(FINIX_SCRIPT_URL);
    expect(script.async).toBe(true);
    expect(script.nonce).toBe("request-nonce");

    const runtime = createFinixGlobal();
    Reflect.set(window, "Finix", runtime);
    script.dispatchEvent(new Event("load"));

    await expect(pending).resolves.toBe(runtime);
  });

  it("deduplicates concurrent script requests", async () => {
    const { loadFinix } = await loadFreshModule();
    const first = loadFinix({ timeoutMs: 1_000 });
    const second = loadFinix({ timeoutMs: 1_000 });
    const scripts = document.querySelectorAll("script[data-finix-sdk='v2']");

    expect(scripts).toHaveLength(1);
    const script = scripts.item(0);
    const runtime = createFinixGlobal();
    Reflect.set(window, "Finix", runtime);
    script.dispatchEvent(new Event("load"));

    await expect(Promise.all([first, second])).resolves.toEqual([runtime, runtime]);
  });

  it("rejects a different Finix-hosted script instead of trusting it", async () => {
    const conflict = document.createElement("script");
    conflict.src = "https://js.finix.com/v/1/finix.js";
    document.head.append(conflict);
    const { loadFinix } = await loadFreshModule();

    await expect(loadFinix()).rejects.toMatchObject({ code: "script_conflict" });
    expect(document.querySelector("script[data-finix-sdk='v2']")).toBeNull();
  });

  it("rejects when the script loads without installing the Finix API", async () => {
    const { loadFinix } = await loadFreshModule();
    const pending = loadFinix({ timeoutMs: 1_000 });
    const script = document.querySelector("script[data-finix-sdk='v2']");

    expect(script).toBeInstanceOf(HTMLScriptElement);
    script?.dispatchEvent(new Event("load"));

    await expect(pending).rejects.toMatchObject({ code: "finix_unavailable" });
  });

  it("removes a newly created script after a network error and permits retry", async () => {
    const { loadFinix } = await loadFreshModule();
    const first = loadFinix({ timeoutMs: 1_000 });
    const firstScript = document.querySelector("script[data-finix-sdk='v2']");
    firstScript?.dispatchEvent(new Event("error"));

    await expect(first).rejects.toMatchObject({ code: "script_load_failed" });
    expect(firstScript?.isConnected).toBe(false);

    const second = loadFinix({ timeoutMs: 1_000 });
    const secondScript = document.querySelector("script[data-finix-sdk='v2']");
    expect(secondScript).not.toBe(firstScript);

    const runtime = createFinixGlobal();
    Reflect.set(window, "Finix", runtime);
    secondScript?.dispatchEvent(new Event("load"));
    await expect(second).resolves.toBe(runtime);
  });

  it("lets one caller abort without cancelling the shared load", async () => {
    const { loadFinix } = await loadFreshModule();
    const controller = new AbortController();
    const aborted = loadFinix({ signal: controller.signal, timeoutMs: 1_000 });
    const active = loadFinix({ timeoutMs: 1_000 });
    const abortedExpectation = expect(aborted).rejects.toMatchObject({ code: "aborted" });

    controller.abort();
    await abortedExpectation;

    const runtime = createFinixGlobal();
    Reflect.set(window, "Finix", runtime);
    document.querySelector("script[data-finix-sdk='v2']")?.dispatchEvent(new Event("load"));
    await expect(active).resolves.toBe(runtime);
  });

  it("times out a stalled load", async () => {
    vi.useFakeTimers();
    const { loadFinix } = await loadFreshModule();
    const pending = loadFinix({ timeoutMs: 25 });
    const expectation = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(25);
    await expectation;
  });
});
