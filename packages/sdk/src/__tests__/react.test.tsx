import {
  Component,
  StrictMode,
  // @ts-expect-error The dev runtime is React 19; public typings stay on React 18 for peer compatibility.
  act,
  createRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FinixClient,
  FinixSdkError,
  type FinixOnUpdate,
  type FinixPaymentFormOptions,
} from "../index";
import {
  FinixForm,
  FinixPaymentForm,
  useFinixAppearance,
  useFinixClient,
  useFinixPaymentForm,
  useFinixPaymentFormContext,
} from "../react";

type NativeSubmitCallback = (error: unknown | null, response: unknown | null) => void;

interface NativeOptions {
  onLoad?: () => void;
  onUpdate?: (state: unknown, binInformation: unknown, hasErrors: unknown) => void;
  onSubmit?: NativeSubmitCallback;
  [key: string]: unknown;
}

interface NativeInstanceHarness {
  destroy: ReturnType<typeof vi.fn>;
  submit: ReturnType<typeof vi.fn>;
  options: NativeOptions;
}

function installRuntime() {
  const instances: NativeInstanceHarness[] = [];
  const paymentForm = vi.fn(
    (
      _element: string | HTMLElement,
      _environment: "sandbox" | "prod",
      _applicationId: string,
      options: NativeOptions = {},
    ) => {
      const instance = {
        destroy: vi.fn(),
        submit: vi.fn((callback: NativeSubmitCallback) => {
          void callback;
        }),
        options,
      };
      instances.push(instance);
      queueMicrotask(() => options.onLoad?.());
      return instance;
    },
  );
  Reflect.set(window, "Finix", { PaymentForm: paymentForm });
  return { instances, paymentForm };
}

interface HookHarnessProps {
  client: FinixClient;
  options?: FinixPaymentFormOptions;
  instanceKey?: string | number;
}

function HookHarness({ client, options, instanceKey }: HookHarnessProps): ReactElement {
  const result = useFinixPaymentForm({ client, options, instanceKey });
  const [submitResult, setSubmitResult] = useState("none");

  return (
    <section>
      <div id="hook-host" ref={result.ref} />
      <output
        id="hook-state"
        data-status={result.status}
        data-errors={String(result.hasErrors)}
        data-card-brand={result.binInformation.cardBrand ?? ""}
        data-number-dirty={String(result.state.number?.isDirty ?? false)}
      />
      <button
        id="submit"
        type="button"
        onClick={() => {
          void result.submit().then(
            (response) => setSubmitResult(response.data.id),
            (error: unknown) => setSubmitResult(error instanceof Error ? error.message : "unknown"),
          );
        }}
      >
        Submit
      </button>
      <output id="submit-result">{submitResult}</output>
    </section>
  );
}

function HeadlessHarness({
  client,
  hostRef,
  instanceKey,
}: {
  client: FinixClient;
  hostRef?: (element: HTMLDivElement | null) => void;
  instanceKey?: string | number;
}): ReactElement {
  const [tokenId, setTokenId] = useState("none");

  return (
    <FinixForm.Root
      client={client}
      instanceKey={instanceKey}
      options={{
        paymentMethods: ["card"],
        styles: {
          default: {
            input: { default: { borderRadius: 16 } },
          },
        },
      }}
    >
      <section className="checkout-shell">
        <FinixForm.Host
          ref={hostRef}
          id="headless-host"
          className="merchant-payment-fields"
          style={{ minHeight: 320 }}
          aria-label="Secure payment fields"
        />
        <FinixForm.Consumer>
          {(controller) => (
            <>
              <output
                id="headless-state"
                data-status={controller.status}
                data-can-submit={String(controller.canSubmit)}
                data-submitting={String(controller.isSubmitting)}
                data-submission-error={controller.submissionError?.code ?? ""}
              />
              <button
                id="merchant-submit"
                type="button"
                className="merchant-button"
                disabled={!controller.canSubmit}
                onClick={() => {
                  void controller.submit().then(
                    (response) => setTokenId(response.data.id),
                    () => undefined,
                  );
                }}
              >
                Use merchant-designed control
              </button>
              <button id="clear-submission-error" type="button" onClick={controller.clearSubmissionError}>
                Clear error
              </button>
              <output id="headless-token">{tokenId}</output>
            </>
          )}
        </FinixForm.Consumer>
      </section>
    </FinixForm.Root>
  );
}

function DuplicateHosts({ client }: { client: FinixClient }): ReactElement {
  return (
    <FinixForm.Root client={client}>
      <FinixForm.Host id="first-host" />
      <FinixForm.Host id="second-host" />
    </FinixForm.Root>
  );
}

interface ErrorBoundaryState {
  error: FinixSdkError | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: FinixSdkError.from(error, "invalid_configuration", "Unexpected React render error."),
    };
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <output
          id="render-error"
          data-code={this.state.error.code}
          data-message={this.state.error.message}
        />
      );
    }
    return this.props.children;
  }
}

function HostHandoffHarness({
  client,
  alternate,
  firstRef,
  secondRef,
}: {
  client: FinixClient;
  alternate: boolean;
  firstRef: (element: HTMLDivElement | null) => void;
  secondRef: (element: HTMLDivElement | null) => void;
}): ReactElement {
  return (
    <FinixForm.Root client={client}>
      {alternate ? (
        <FinixForm.Host key="alternate" ref={secondRef} id="alternate-host" />
      ) : (
        <FinixForm.Host key="initial" ref={firstRef} id="initial-host" />
      )}
    </FinixForm.Root>
  );
}

function ControllerWithoutHost({ client }: { client: FinixClient }): ReactElement {
  const controller = useFinixPaymentForm({ client });
  return (
    <button
      id="submit-without-host"
      type="button"
      data-error={controller.submissionError?.code ?? ""}
      onClick={() => void controller.submit().catch(() => undefined)}
    >
      Submit
    </button>
  );
}

function ContextWithoutRoot(): ReactElement {
  useFinixPaymentFormContext();
  return <div />;
}

async function flushReact(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  Reflect.deleteProperty(window, "Finix");
  container = document.createElement("div");
  document.body.replaceChildren(container);
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  root = undefined;
  document.body.replaceChildren();
  Reflect.deleteProperty(window, "Finix");
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
});

describe("useFinixPaymentForm", () => {
  it("owns one form through StrictMode and destroys it once on unmount", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const mount = vi.spyOn(client, "mount");
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <StrictMode>
          <HookHarness client={client} options={{ paymentMethods: ["card"] }} />
        </StrictMode>,
      );
    });
    await flushReact();

    const state = container.querySelector("#hook-state");
    expect(state?.getAttribute("data-status")).toBe("ready");
    expect(mount).toHaveBeenCalledOnce();
    expect(runtime.paymentForm).toHaveBeenCalledOnce();
    expect(runtime.instances[0]?.destroy).not.toHaveBeenCalled();

    await act(async () => root?.unmount());
    root = undefined;
    expect(runtime.instances[0]?.destroy).toHaveBeenCalledOnce();
  });

  it("uses the latest callbacks without remounting the hosted iframe", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const firstUpdate = vi.fn<FinixOnUpdate>();
    const secondUpdate = vi.fn<FinixOnUpdate>();
    root = createRoot(container);

    await act(async () => {
      root?.render(<HookHarness client={client} options={{ paymentMethods: ["card"], onUpdate: firstUpdate }} />);
    });
    await flushReact();
    expect(runtime.paymentForm).toHaveBeenCalledOnce();

    await act(async () => {
      root?.render(<HookHarness client={client} options={{ paymentMethods: ["card"], onUpdate: secondUpdate }} />);
    });
    await flushReact();
    expect(runtime.paymentForm).toHaveBeenCalledOnce();

    await act(async () => {
      runtime.instances[0]?.options.onUpdate?.(
        { number: { isDirty: true } },
        { cardBrand: "VISA" },
        false,
      );
    });

    expect(firstUpdate).not.toHaveBeenCalled();
    expect(secondUpdate).toHaveBeenCalledOnce();
    const state = container.querySelector("#hook-state");
    expect(state?.getAttribute("data-errors")).toBe("false");
    expect(state?.getAttribute("data-card-brand")).toBe("VISA");
  });

  it("preserves the native form and entered-state metadata when options change", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    root = createRoot(container);

    await act(async () => {
      root?.render(<HookHarness client={client} options={{ paymentMethods: ["card"] }} />);
    });
    await flushReact();
    await act(async () => {
      runtime.instances[0]?.options.onUpdate?.(
        { number: { isDirty: true } },
        { cardBrand: "VISA" },
        false,
      );
    });

    await act(async () => {
      root?.render(
        <HookHarness
          client={client}
          options={{
            paymentMethods: ["bank"],
            styles: { default: { input: { default: { borderColor: "purple" } } } },
          }}
        />,
      );
    });
    await flushReact();

    expect(runtime.paymentForm).toHaveBeenCalledOnce();
    expect(runtime.instances[0]?.destroy).not.toHaveBeenCalled();
    expect(runtime.instances[0]?.options.paymentMethods).toEqual(["card"]);
    const state = container.querySelector("#hook-state");
    expect(state?.getAttribute("data-number-dirty")).toBe("true");
    expect(state?.getAttribute("data-card-brand")).toBe("VISA");
    expect(state?.getAttribute("data-errors")).toBe("false");
    // Development-only hint that the new options were not applied.
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/instanceKey/);
    warn.mockRestore();
  });

  it("destroys once and recreates only when instanceKey changes", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <HookHarness
          client={client}
          instanceKey="checkout-one"
          options={{ paymentMethods: ["card"] }}
        />,
      );
    });
    await flushReact();
    await act(async () => {
      runtime.instances[0]?.options.onUpdate?.(
        { number: { isDirty: true } },
        { cardBrand: "VISA" },
        false,
      );
    });

    await act(async () => {
      root?.render(
        <HookHarness
          client={client}
          instanceKey="checkout-two"
          options={{ paymentMethods: ["bank"] }}
        />,
      );
    });
    await flushReact();

    expect(runtime.paymentForm).toHaveBeenCalledTimes(2);
    expect(runtime.instances[0]?.destroy).toHaveBeenCalledOnce();
    expect(runtime.instances[1]?.destroy).not.toHaveBeenCalled();
    expect(runtime.instances[1]?.options.paymentMethods).toEqual(["bank"]);
    const state = container.querySelector("#hook-state");
    expect(state?.getAttribute("data-number-dirty")).toBe("false");
    expect(state?.getAttribute("data-card-brand")).toBe("");
    expect(state?.getAttribute("data-errors")).toBe("true");
  });

  it("routes submit through the ready form", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    root = createRoot(container);

    await act(async () => {
      root?.render(<HookHarness client={client} />);
    });
    await flushReact();

    const button = container.querySelector("#submit");
    expect(button).toBeInstanceOf(HTMLButtonElement);
    await act(async () => {
      if (button instanceof HTMLButtonElement) {
        button.click();
      }
    });
    expect(runtime.instances[0]?.submit).toHaveBeenCalledOnce();
    const callback = runtime.instances[0]?.submit.mock.calls[0]?.[0];
    expect(typeof callback).toBe("function");
    await act(async () => {
      if (typeof callback === "function") {
        callback(null, { data: { id: "TK_react" } });
      }
      await Promise.resolve();
    });
    expect(container.querySelector("#submit-result")?.textContent).toBe("TK_react");
  });
});

describe("FinixPaymentForm", () => {
  it("forwards host attributes and refs while owning the Finix lifecycle", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const forwardedRef = createRef<HTMLDivElement>();
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <FinixPaymentForm
          ref={forwardedRef}
          client={client}
          options={{ paymentMethods: ["bank"] }}
          id="component-host"
          aria-label="Secure payment details"
        />,
      );
    });
    await flushReact();

    expect(forwardedRef.current?.id).toBe("component-host");
    expect(forwardedRef.current?.getAttribute("aria-label")).toBe("Secure payment details");
    expect(runtime.paymentForm).toHaveBeenCalledOnce();
  });

  it("hands the controller to a render-prop child and rejects static children", async () => {
    installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <FinixPaymentForm client={client} id="host">
          {(controller) => (
            <button type="button" id="pay" disabled={!controller.canSubmit}>
              {controller.status}
            </button>
          )}
        </FinixPaymentForm>,
      );
    });
    await flushReact();

    const button = container.querySelector<HTMLButtonElement>("#pay");
    expect(container.querySelector("#host")?.nextElementSibling).toBe(button);
    expect(button?.textContent).toBe("ready");
    expect(button?.disabled).toBe(true);
    expect(container.querySelector("#host")?.childElementCount).toBe(1);

    expect(() =>
      renderToString(
        <FinixPaymentForm client={client}>
          {/* @ts-expect-error static children are not allowed */}
          <span>static</span>
        </FinixPaymentForm>,
      ),
    ).toThrow(FinixSdkError);
  });
});

describe("useFinixClient and useFinixAppearance", () => {
  it("memoizes the client on config values and flattens the appearance per scheme", async () => {
    installRuntime();
    const clients: FinixClient[] = [];
    const seen: Array<{ enableDarkMode: boolean; instanceKey: string }> = [];
    const brand = {
      styles: { default: { input: { default: { padding: "8px" } } }, dark: { input: { default: { color: "#fff" } } } },
    };

    function Harness({ scheme, tick }: { scheme: "light" | "dark"; tick: number }): ReactElement {
      const client = useFinixClient({ environment: "sandbox", applicationId: "AP_test" });
      const { appearance, instanceKey } = useFinixAppearance(brand, scheme);
      clients.push(client);
      seen.push({ enableDarkMode: appearance.enableDarkMode, instanceKey });
      return <span data-tick={tick} data-color={appearance.styles?.default?.input?.default?.color} />;
    }

    root = createRoot(container);
    await act(async () => {
      root?.render(<Harness scheme="light" tick={1} />);
    });
    await act(async () => {
      root?.render(<Harness scheme="light" tick={2} />);
    });
    await act(async () => {
      root?.render(<Harness scheme="dark" tick={3} />);
    });

    expect(new Set(clients).size).toBe(1);
    expect(seen.at(0)).toEqual({ enableDarkMode: false, instanceKey: "light" });
    expect(seen.at(-1)).toEqual({ enableDarkMode: true, instanceKey: "dark" });
    expect(container.querySelector("span")?.getAttribute("data-color")).toBe("#fff");
  });
});

describe("FinixForm headless primitives", () => {
  it("keeps merchant markup unstyled while exposing form and submission state", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const hostRef = vi.fn<(element: HTMLDivElement | null) => void>();
    root = createRoot(container);

    await act(async () => {
      root?.render(<HeadlessHarness client={client} hostRef={hostRef} />);
    });
    await flushReact();

    const host = container.querySelector("#headless-host");
    const state = container.querySelector("#headless-state");
    const button = container.querySelector("#merchant-submit");
    expect(host?.className).toBe("merchant-payment-fields");
    expect(host?.getAttribute("aria-label")).toBe("Secure payment fields");
    expect(hostRef).toHaveBeenCalledWith(host);
    expect(host?.getAttribute("data-finix-status")).toBe("ready");
    expect(state?.getAttribute("data-can-submit")).toBe("false");
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(runtime.instances[0]?.options.styles).toEqual({
      default: { input: { default: { borderRadius: 16 } } },
    });

    await act(async () => {
      runtime.instances[0]?.options.onUpdate?.({}, {}, false);
    });
    expect(host?.getAttribute("data-finix-valid")).toBe("true");
    expect(state?.getAttribute("data-can-submit")).toBe("true");

    await act(async () => {
      if (button instanceof HTMLButtonElement) {
        button.click();
      }
    });
    expect(state?.getAttribute("data-submitting")).toBe("true");
    expect(runtime.instances[0]?.submit).toHaveBeenCalledOnce();

    const callback = runtime.instances[0]?.submit.mock.calls[0]?.[0];
    await act(async () => {
      if (typeof callback === "function") {
        callback(null, { data: { id: "TK_headless" } });
      }
      await Promise.resolve();
    });

    expect(state?.getAttribute("data-submitting")).toBe("false");
    expect(container.querySelector("#headless-token")?.textContent).toBe("TK_headless");
  });

  it("exposes normalized submission errors and lets custom UI clear them", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    root = createRoot(container);

    await act(async () => {
      root?.render(<HeadlessHarness client={client} />);
    });
    await flushReact();
    await act(async () => {
      runtime.instances[0]?.options.onUpdate?.({}, {}, false);
    });

    const button = container.querySelector("#merchant-submit");
    await act(async () => {
      if (button instanceof HTMLButtonElement) {
        button.click();
      }
    });
    const callback = runtime.instances[0]?.submit.mock.calls[0]?.[0];
    await act(async () => {
      if (typeof callback === "function") {
        callback({ message: "declined" }, null);
      }
      await Promise.resolve();
    });

    const state = container.querySelector("#headless-state");
    const host = container.querySelector("#headless-host");
    expect(state?.getAttribute("data-submission-error")).toBe("tokenization_failed");
    expect(host?.getAttribute("data-finix-error")).toBe("tokenization_failed");

    await act(async () => {
      const clear = container.querySelector("#clear-submission-error");
      if (clear instanceof HTMLButtonElement) {
        clear.click();
      }
    });
    expect(state?.getAttribute("data-submission-error")).toBe("");
    expect(host?.hasAttribute("data-finix-error")).toBe(false);
  });

  it("reports submission attempts before a host is ready", async () => {
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    root = createRoot(container);

    await act(async () => {
      root?.render(<ControllerWithoutHost client={client} />);
    });
    const button = container.querySelector("#submit-without-host");
    await act(async () => {
      if (button instanceof HTMLButtonElement) {
        button.click();
      }
      await Promise.resolve();
    });
    expect(button?.getAttribute("data-error")).toBe("payment_form_unavailable");
  });

  it("rejects context access outside a root", () => {
    expect(() => renderToString(<ContextWithoutRoot />)).toThrowError(
      expect.objectContaining({ code: "invalid_configuration" }),
    );
  });

  it("rejects duplicate attached Hosts within one Root", async () => {
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    root = createRoot(container);

    try {
      await act(async () => {
        root?.render(
          <ErrorBoundary>
            <DuplicateHosts client={client} />
          </ErrorBoundary>,
        );
      });
      const error = container.querySelector("#render-error");
      expect(error?.getAttribute("data-code")).toBe("invalid_configuration");
      expect(error?.getAttribute("data-message")).toBe(
        "FinixForm.Root can own exactly one attached FinixForm.Host.",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("releases ownership before handing the Root to a replacement Host", async () => {
    const runtime = installRuntime();
    const client = new FinixClient({ environment: "sandbox", applicationId: "AP_test" });
    const firstRef = vi.fn<(element: HTMLDivElement | null) => void>();
    const secondRef = vi.fn<(element: HTMLDivElement | null) => void>();
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <StrictMode>
          <HostHandoffHarness
            client={client}
            alternate={false}
            firstRef={firstRef}
            secondRef={secondRef}
          />
        </StrictMode>,
      );
    });
    await flushReact();
    expect(runtime.paymentForm).toHaveBeenCalledOnce();
    expect(firstRef).toHaveBeenCalledWith(container.querySelector("#initial-host"));

    await act(async () => {
      root?.render(
        <StrictMode>
          <HostHandoffHarness
            client={client}
            alternate
            firstRef={firstRef}
            secondRef={secondRef}
          />
        </StrictMode>,
      );
    });
    await flushReact();

    expect(firstRef).toHaveBeenCalledWith(null);
    expect(secondRef).toHaveBeenCalledWith(container.querySelector("#alternate-host"));
    expect(runtime.instances[0]?.destroy).toHaveBeenCalledOnce();
    expect(runtime.paymentForm).toHaveBeenCalledTimes(2);
    expect(runtime.instances[1]?.destroy).not.toHaveBeenCalled();
  });
});
