import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FinixClient, FinixSdkError, type FinixPaymentFormOptions, type FinixTokenResponse } from "../index";

type NativeSubmitCallback = (error: unknown | null, response: unknown | null) => void;

interface CapturedNativeOptions {
  onLoad?: () => void;
  onUpdate?: (state: unknown, binInformation: unknown, hasErrors: unknown) => void;
  onSubmit?: NativeSubmitCallback;
  onError?: (error: unknown) => void;
  [key: string]: unknown;
}

interface RuntimeHarness {
  paymentForm: ReturnType<typeof vi.fn>;
  submit: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  submitCallbacks: NativeSubmitCallback[];
  options(): CapturedNativeOptions;
}

interface HarnessOptions {
  autoLoad?: boolean;
  nativeDestroy?: boolean;
}

function installRuntime({ autoLoad = true, nativeDestroy = true }: HarnessOptions = {}): RuntimeHarness {
  let capturedOptions: CapturedNativeOptions = {};
  const submitCallbacks: NativeSubmitCallback[] = [];
  const submit = vi.fn((callback: NativeSubmitCallback) => {
    submitCallbacks.push(callback);
  });
  const destroy = vi.fn();
  const paymentForm = vi.fn(
    (
      _element: string | HTMLElement,
      _environment: "sandbox" | "prod",
      _applicationId: string,
      options: CapturedNativeOptions = {},
    ) => {
      capturedOptions = options;
      if (_element instanceof HTMLElement) {
        _element.append(document.createElement("iframe"));
      }
      if (autoLoad) {
        queueMicrotask(() => options.onLoad?.());
      }
      return nativeDestroy ? { submit, destroy } : { submit };
    },
  );

  Reflect.set(window, "Finix", { PaymentForm: paymentForm });
  return {
    paymentForm,
    submit,
    destroy,
    submitCallbacks,
    options: () => capturedOptions,
  };
}

function tokenResponse(id = "TK_test_token"): FinixTokenResponse {
  return {
    data: {
      id,
      currency: "USD",
      instrument_type: "PAYMENT_CARD",
    },
  };
}

async function mountForm(
  runtimeOptions?: HarnessOptions,
  formOptions: FinixPaymentFormOptions = {},
  clientConfig: ConstructorParameters<typeof FinixClient>[0] = {
    environment: "sandbox",
    applicationId: "AP_test_application",
  },
) {
  const runtime = installRuntime(runtimeOptions);
  const host = document.createElement("div");
  host.id = "finix-host";
  document.body.append(host);
  const client = new FinixClient(clientConfig);
  const form = await client.mount(host, formOptions);
  return { client, form, host, runtime };
}

beforeEach(() => {
  document.body.replaceChildren();
  Reflect.deleteProperty(window, "Finix");
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  Reflect.deleteProperty(window, "Finix");
});

describe("FinixClient", () => {
  it("rejects invalid runtime configuration without relying on TypeScript", () => {
    expect(() => Reflect.construct(FinixClient, [{ environment: "staging", applicationId: "AP_test" }])).toThrowError(
      expect.objectContaining({ code: "invalid_configuration" }),
    );
    expect(() => Reflect.construct(FinixClient, [{ environment: "sandbox", applicationId: "" }])).toThrowError(
      expect.objectContaining({ code: "invalid_configuration" }),
    );
    expect(() => Reflect.construct(FinixClient, [{ environment: "sandbox", applicationId: "AP_test", script: { url: "https://example.com/sdk.js" } }])).toThrowError(
      expect.objectContaining({ code: "invalid_configuration" }),
    );
    expect(() => Reflect.construct(FinixClient, [{ environment: "sandbox", applicationId: "AP_test", submissionTimeoutMs: 0 }])).toThrowError(
      expect.objectContaining({ code: "invalid_configuration" }),
    );
  });

  it("mounts the official form into an SDK-owned child and forwards documented options", async () => {
    const onLoad = vi.fn();
    const onError = vi.fn();
    const { form, host, runtime } = await mountForm(undefined, {
      paymentMethods: ["card"],
      showAddress: true,
      onLoad,
      onError,
    });

    expect(runtime.paymentForm).toHaveBeenCalledOnce();
    expect(runtime.paymentForm).toHaveBeenCalledWith(
      host.firstElementChild,
      "sandbox",
      "AP_test_application",
      expect.objectContaining({ paymentMethods: ["card"], showAddress: true }),
    );
    expect(host.firstElementChild?.getAttribute("data-finix-payment-form")).toBe("v2");
    expect(runtime.options()).not.toHaveProperty("onError");
    expect(onLoad).toHaveBeenCalledOnce();
    expect(form.destroyed).toBe(false);
  });

  it("disables internal scrolling on the hosted iframe once the form loads", async () => {
    const { host } = await mountForm();

    const iframe = host.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("scrolling")).toBe("no");
  });

  it("supports an element ID and rejects a missing mount without calling Finix.PaymentForm", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const host = document.createElement("div");
    host.id = "known-host";
    document.body.append(host);

    await expect(client.mount("missing-host")).rejects.toMatchObject({ code: "invalid_configuration" });
    expect(runtime.paymentForm).not.toHaveBeenCalled();

    await expect(client.mount("known-host")).resolves.toMatchObject({ destroyed: false });
    expect(runtime.paymentForm).toHaveBeenCalledOnce();
  });

  it("rejects undocumented, malformed, and PCI-sensitive options at runtime", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const host = document.createElement("div");

    await expect(Reflect.apply(client.mount, client, [host, { unknownOption: true }])).rejects.toMatchObject({ code: "invalid_configuration" });
    await expect(Reflect.apply(client.mount, client, [host, { hideFields: ["number"] }])).rejects.toMatchObject({ code: "invalid_configuration" });
    await expect(Reflect.apply(client.mount, client, [host, { defaultValues: { number: "4111111111111111" } }])).rejects.toMatchObject({ code: "invalid_configuration" });
    await expect(Reflect.apply(client.mount, client, [host, { fonts: [{ fontFamily: "Unsafe", format: "woff2", url: "http://example.com/font.woff2" }] }])).rejects.toMatchObject({ code: "invalid_configuration" });
    expect(runtime.paymentForm).not.toHaveBeenCalled();
  });

  it("rejects malformed values throughout the documented options surface", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const host = document.createElement("div");
    const invalidOptions: readonly unknown[] = [
      null,
      [],
      { paymentMethods: [] },
      { paymentMethods: ["bank", "card"] },
      { showAddress: "yes" },
      { hideFields: ["security_code", "security_code"] },
      { requiredFields: ["number"] },
      { labels: { number: 42 } },
      { placeholders: { unsupported: "value" } },
      { submitLabel: "" },
      { theme: "unknown" },
      { styles: { contrast: {} } },
      { styles: { default: { input: { disabled: { color: "gray" } } } } },
      { styles: { default: { input: { default: { color: false } } } } },
      { fonts: {} },
      { fonts: [{ fontFamily: "", url: "https://example.com/font.woff2", format: "woff2" }] },
      { fonts: [{ fontFamily: "Font", url: "not-a-url", format: "woff2" }] },
      { plaidLinkSettings: { unsupported: true } },
      { plaidLinkSettings: { countries: [""] } },
      { onUpdate: "not-a-function" },
    ];

    for (const options of invalidOptions) {
      await expect(Reflect.apply(client.mount, client, [host, options])).rejects.toMatchObject({
        code: "invalid_configuration",
      });
    }
    expect(runtime.paymentForm).not.toHaveBeenCalled();
  });

  it("accepts and forwards every documented form style state", async () => {
    const styles = {
      default: {
        form: {
          default: { color: "black" },
          error: { color: "red" },
          success: { color: "green" },
          focused: { outlineColor: "blue" },
        },
      },
    } as const;
    const { runtime } = await mountForm(undefined, { styles });

    expect(runtime.options().styles).toEqual(styles);
  });

  it("times out initialization, destroys owned resources, and invalidates a late onLoad callback", async () => {
    vi.useFakeTimers();
    const onLoad = vi.fn();
    const onError = vi.fn();
    const runtime = installRuntime({ autoLoad: false });
    const host = document.createElement("div");
    document.body.append(host);
    const client = new FinixClient({
      environment: "sandbox",
      applicationId: "AP_test",
      formReadyTimeoutMs: 25,
    });
    const pending = client.mount(host, { onLoad, onError });
    const expectation = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(25);
    await expectation;
    expect(runtime.destroy).toHaveBeenCalledOnce();
    expect(host.childElementCount).toBe(0);

    runtime.options().onLoad?.();
    expect(onLoad).not.toHaveBeenCalled();
  });

  it("queues synchronous vendor callbacks until the wrapper instance exists", async () => {
    const onUpdate = vi.fn();
    const onSubmit = vi.fn();
    const submit = vi.fn((callback: NativeSubmitCallback) => {
      void callback;
    });
    const paymentForm = vi.fn(
      (
        _element: string | HTMLElement,
        _environment: "sandbox" | "prod",
        _applicationId: string,
        options: CapturedNativeOptions = {},
      ) => {
        options.onUpdate?.({ number: { isDirty: true } }, { cardBrand: "VISA" }, false);
        options.onSubmit?.(null, tokenResponse("TK_synchronous"));
        options.onLoad?.();
        return { submit };
      },
    );
    Reflect.set(window, "Finix", { PaymentForm: paymentForm });
    const host = document.createElement("div");
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });

    const form = await client.mount(host, { onUpdate, onSubmit });

    expect(form.hasErrors).toBe(false);
    expect(form.state.number).toEqual({ isDirty: true });
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(null, { ...tokenResponse("TK_synchronous"), token: "TK_synchronous" });
  });

  it("supports the object-form onChange and onSubmitResult callbacks", async () => {
    const onChange = vi.fn();
    const onSubmitResult = vi.fn();
    const { form, runtime } = await mountForm(undefined, { onChange, onSubmitResult });

    // onSubmitResult alone must ask Finix to render its own button (onSubmit is forwarded).
    expect(runtime.paymentForm.mock.calls[0]?.[3]).toHaveProperty("onSubmit");

    runtime.options().onUpdate?.({ number: { isDirty: true } }, { cardBrand: "visa" }, false);
    expect(onChange).toHaveBeenCalledWith({
      state: { number: { isDirty: true } },
      binInformation: { cardBrand: "visa" },
      hasErrors: false,
    });

    const pending = form.submit();
    runtime.submitCallbacks[0]?.(null, tokenResponse("TK_object"));
    await expect(pending).resolves.toMatchObject({ token: "TK_object" });
    expect(onSubmitResult).toHaveBeenCalledWith({
      ok: true,
      token: "TK_object",
      response: { ...tokenResponse("TK_object"), token: "TK_object" },
      error: null,
    });

    const failing = form.submit();
    runtime.submitCallbacks[1]?.({ message: "declined" }, null);
    await expect(failing).rejects.toBeInstanceOf(FinixSdkError);
    const failure = onSubmitResult.mock.calls[1]?.[0] as { ok: boolean; token: null; error: FinixSdkError };
    expect(failure.ok).toBe(false);
    expect(failure.token).toBeNull();
    expect(failure.error.code).toBe("tokenization_failed");
  });
});

describe("PaymentFormInstance", () => {
  it("validates and resolves a successful token response", async () => {
    const { form, runtime } = await mountForm();
    const pending = form.submit();
    expect(runtime.submit).toHaveBeenCalledOnce();

    runtime.submitCallbacks[0]?.(null, tokenResponse());
    await expect(pending).resolves.toEqual({ ...tokenResponse(), token: "TK_test_token" });
  });

  it("normalizes vendor errors and rejects malformed or ambiguous callback pairs", async () => {
    const onSubmit = vi.fn();
    const { form, runtime } = await mountForm(undefined, { onSubmit });

    const failed = form.submit();
    runtime.submitCallbacks[0]?.({ status: 422, message: "invalid" }, null);
    await expect(failed).rejects.toMatchObject({ code: "tokenization_failed" });
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ code: "tokenization_failed" }), null);

    const malformed = form.submit();
    runtime.submitCallbacks[1]?.(null, { data: { currency: "USD" } });
    await expect(malformed).rejects.toMatchObject({ code: "invalid_response" });

    const ambiguous = form.submit();
    runtime.submitCallbacks[2]?.({ status: 500 }, tokenResponse());
    await expect(ambiguous).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("rejects concurrent submissions while allowing a new one after settlement", async () => {
    const { form, runtime } = await mountForm();
    const first = form.submit();

    await expect(form.submit()).rejects.toMatchObject({ code: "submission_in_progress" });
    expect(runtime.submit).toHaveBeenCalledOnce();

    runtime.submitCallbacks[0]?.(null, tokenResponse("TK_first"));
    await expect(first).resolves.toMatchObject({ data: { id: "TK_first" } });

    const second = form.submit();
    expect(runtime.submit).toHaveBeenCalledTimes(2);
    runtime.submitCallbacks[1]?.(null, tokenResponse("TK_second"));
    await expect(second).resolves.toMatchObject({ data: { id: "TK_second" } });
  });

  it("supports timeout and abort without accepting a stale response for a later submission", async () => {
    vi.useFakeTimers();
    const { form, runtime } = await mountForm();
    const timedOut = form.submit({ timeoutMs: 25 });
    const timeoutExpectation = expect(timedOut).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(25);
    await timeoutExpectation;

    const controller = new AbortController();
    const aborted = form.submit({ signal: controller.signal, timeoutMs: 1_000 });
    const abortExpectation = expect(aborted).rejects.toMatchObject({ code: "aborted" });
    controller.abort();
    await abortExpectation;

    const current = form.submit({ timeoutMs: 1_000 });
    runtime.submitCallbacks[0]?.(null, tokenResponse("TK_stale"));
    let currentSettled = false;
    void current.finally(() => {
      currentSettled = true;
    });
    await Promise.resolve();
    expect(currentSettled).toBe(false);

    runtime.submitCallbacks[2]?.(null, tokenResponse("TK_current"));
    await expect(current).resolves.toMatchObject({ data: { id: "TK_current" } });
  });

  it("sanitizes update data so raw payment values cannot cross the wrapper boundary", async () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();
    const { form, runtime } = await mountForm(undefined, { onUpdate, onError });

    runtime.options().onUpdate?.(
      {
        number: { errors: false, isDirty: true, value: "4111111111111111", errorMessages: [] },
        "address.country": { value: "USA", selected: "USA" },
      },
      { bin: "411111", cardBrand: "VISA", raw: "drop-me" },
      false,
    );

    expect(form.state.number).toEqual({ errors: false, isDirty: true, errorMessages: [] });
    expect(form.state["address.country"]).toEqual({ selected: "USA", value: "USA" });
    expect(form.binInformation).toEqual({ bin: "411111", cardBrand: "VISA" });
    expect(form.hasErrors).toBe(false);
    expect(onUpdate).toHaveBeenCalledWith(form.state, form.binInformation, false);

    runtime.options().onUpdate?.({}, {}, "not-a-boolean");
    expect(form.hasErrors).toBe(true);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "invalid_response" }));
  });

  it("contains consumer callback exceptions and reports them through onError", async () => {
    const onError = vi.fn();
    const onUpdate = vi.fn(() => {
      throw new Error("consumer bug");
    });
    const { runtime } = await mountForm(undefined, { onUpdate, onError });

    expect(() => runtime.options().onUpdate?.({}, {}, false)).not.toThrow();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "callback_error" }));
  });

  it("normalizes a synchronous vendor submit exception", async () => {
    const runtime = installRuntime();
    runtime.submit.mockImplementationOnce(() => {
      throw new Error("vendor submit crashed");
    });
    const host = document.createElement("div");
    document.body.append(host);
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const form = await client.mount(host);

    await expect(form.submit()).rejects.toMatchObject({
      code: "tokenization_failed",
      message: "vendor submit crashed",
    });
  });

  it("reports vendor destroy exceptions while still removing owned DOM", async () => {
    const onError = vi.fn();
    const { form, host, runtime } = await mountForm(undefined, { onError });
    runtime.destroy.mockImplementationOnce(() => {
      throw new Error("vendor destroy crashed");
    });

    expect(() => form.destroy()).not.toThrow();
    expect(host.childElementCount).toBe(0);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "payment_form_unavailable" }));
  });

  it("destroys idempotently, rejects pending work, and ignores late callbacks", async () => {
    const onUpdate = vi.fn();
    const onSubmit = vi.fn();
    const { form, host, runtime } = await mountForm(undefined, { onUpdate, onSubmit });
    const pending = form.submit();
    const expectation = expect(pending).rejects.toMatchObject({ code: "destroyed" });

    form.destroy();
    form.destroy();
    await expectation;

    expect(runtime.destroy).toHaveBeenCalledOnce();
    expect(host.childElementCount).toBe(0);
    expect(form.destroyed).toBe(true);
    await expect(form.submit()).rejects.toMatchObject({ code: "destroyed" });

    runtime.options().onUpdate?.({ number: { isDirty: true } }, {}, false);
    runtime.submitCallbacks[0]?.(null, tokenResponse());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears only SDK-owned DOM when the vendor does not expose destroy", async () => {
    const { form, host, runtime } = await mountForm({ nativeDestroy: false });
    const sibling = document.createElement("span");
    sibling.textContent = "merchant-owned";
    host.prepend(sibling);

    form.destroy();

    expect(runtime.destroy).not.toHaveBeenCalled();
    expect(host.contains(sibling)).toBe(true);
    expect(host.querySelector("[data-finix-payment-form='v2']")).toBeNull();
  });
});

describe("FinixSdkError", () => {
  it("preserves existing SDK errors and wraps unknown failures without using unsafe casts", () => {
    const existing = new FinixSdkError("aborted", "already normalized");
    expect(FinixSdkError.from(existing, "invalid_response", "fallback")).toBe(existing);

    const cause = new Error("vendor failure");
    expect(FinixSdkError.from(cause, "tokenization_failed", "fallback")).toMatchObject({
      code: "tokenization_failed",
      message: "vendor failure",
      cause,
    });
  });
});
