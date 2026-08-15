import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFinixAuth } from "../index";

type SessionCallback = (sessionKey: string) => void;

interface AuthHarnessOptions {
  initialKey?: string;
  callbackKey?: string;
  includeAuth?: boolean;
}

function installAuthRuntime({ initialKey, callbackKey, includeAuth = true }: AuthHarnessOptions = {}) {
  let currentKey = initialKey;
  const connectCallbacks: SessionCallback[] = [];
  const getSessionKey = vi.fn(() => currentKey);
  const connect = vi.fn((_merchantId: string, callback?: SessionCallback) => {
    if (callback) {
      connectCallbacks.push(callback);
    }
  });
  const auth = vi.fn(
    (
      _environment: "sandbox" | "live",
      _merchantId: string,
      callback?: SessionCallback,
    ) => {
      if (callbackKey !== undefined) {
        queueMicrotask(() => callback?.(callbackKey));
      }
      return { getSessionKey, connect };
    },
  );
  const runtime = includeAuth
    ? { PaymentForm: () => ({ submit: () => undefined }), Auth: auth }
    : { PaymentForm: () => ({ submit: () => undefined }) };
  Reflect.set(window, "Finix", runtime);

  return {
    auth,
    connect,
    connectCallbacks,
    getSessionKey,
    setCurrentKey: (sessionKey: string) => {
      currentKey = sessionKey;
    },
  };
}

beforeEach(() => {
  Reflect.deleteProperty(window, "Finix");
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(window, "Finix");
});

describe("createFinixAuth", () => {
  it("keeps the documented Auth environment distinct and resolves an immediate key", async () => {
    const runtime = installAuthRuntime({ initialKey: "session-initial" });

    const session = await createFinixAuth({
      environment: "live",
      merchantId: "MU_test_merchant",
    });

    expect(runtime.auth).toHaveBeenCalledWith("live", "MU_test_merchant", expect.any(Function));
    expect(session.getSessionKey()).toBe("session-initial");
  });

  it("resolves the asynchronous Finix.Auth callback and tracks refreshed keys", async () => {
    const runtime = installAuthRuntime({ callbackKey: "session-callback" });
    const session = await createFinixAuth({
      environment: "sandbox",
      merchantId: "MU_test_merchant",
    });

    expect(session.getSessionKey()).toBe("session-callback");
    runtime.setCurrentKey("session-refreshed");
    expect(session.getSessionKey()).toBe("session-refreshed");
  });

  it("rejects invalid configuration and a runtime without Finix.Auth", async () => {
    installAuthRuntime({ includeAuth: false });

    await expect(
      Reflect.apply(createFinixAuth, undefined, [{ environment: "prod", merchantId: "MU_test" }]),
    ).rejects.toMatchObject({ code: "invalid_configuration" });
    await expect(
      createFinixAuth({ environment: "sandbox", merchantId: "MU_test" }),
    ).rejects.toMatchObject({ code: "auth_unavailable" });
  });

  it("rejects invalid initial session keys", async () => {
    installAuthRuntime({ callbackKey: "" });

    await expect(
      createFinixAuth(
        { environment: "sandbox", merchantId: "MU_test", readyTimeoutMs: 1_000 },
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("connects to another merchant and validates the returned key", async () => {
    const runtime = installAuthRuntime({ initialKey: "session-initial" });
    const session = await createFinixAuth({ environment: "sandbox", merchantId: "MU_first" });
    const connected = session.connect("MU_second", { timeoutMs: 1_000 });

    expect(runtime.connect).toHaveBeenCalledWith("MU_second", expect.any(Function));
    runtime.connectCallbacks[0]?.("session-second");
    await expect(connected).resolves.toBe("session-second");
    expect(session.getSessionKey()).toBe("session-second");

    const invalid = session.connect("MU_third", { timeoutMs: 1_000 });
    runtime.connectCallbacks[1]?.("");
    await expect(invalid).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("supports abort and timeout while waiting for Auth", async () => {
    vi.useFakeTimers();
    installAuthRuntime();
    const controller = new AbortController();
    const aborted = createFinixAuth(
      { environment: "sandbox", merchantId: "MU_test", readyTimeoutMs: 1_000 },
      { signal: controller.signal },
    );
    const abortExpectation = expect(aborted).rejects.toMatchObject({ code: "aborted" });
    controller.abort();
    await abortExpectation;

    const timedOut = createFinixAuth({
      environment: "sandbox",
      merchantId: "MU_test",
      readyTimeoutMs: 25,
    });
    const timeoutExpectation = expect(timedOut).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(25);
    await timeoutExpectation;
  });
});
