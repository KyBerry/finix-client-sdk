import { describe, expect, it } from "vitest";

import {
  defineFinixHostedAppearance,
  defineFinixHostedAppearanceAdapter,
  defineFinixPaymentFormOptions,
  defineFinixStyles,
  FinixSdkError,
  mergeFinixStyles,
  resolveFinixAppearance,
} from "../index";

describe("Finix appearance helpers", () => {
  it("defines reusable appearance and form options without changing their values", () => {
    const styles = {
      default: {
        input: {
          default: { borderRadius: 12 },
        },
      },
    } as const;
    const appearance = {
      theme: "elevated",
      enableDarkMode: true,
      hidePotentialIssueMessages: true,
      hideErrorMessages: false,
      styles,
    } as const;
    const options = {
      paymentMethods: ["card"],
      showAddress: true,
      ...appearance,
    } as const;

    expect(defineFinixStyles(styles)).toBe(styles);
    expect(defineFinixHostedAppearance(appearance)).toBe(appearance);
    expect(defineFinixPaymentFormOptions(options)).toBe(options);
  });

  it("adapts application themes and validates every generated appearance", () => {
    interface AppTheme {
      mode: "light" | "dark";
      focusColor: string;
    }

    const output = {
      theme: "finix",
      styles: {
        default: {
          input: { focused: { borderColor: "royalblue" } },
        },
      },
    } as const;
    const adapter = defineFinixHostedAppearanceAdapter<AppTheme>()((theme) => ({
      ...output,
      theme: theme.mode === "dark" ? "midnight" : "finix",
      styles: {
        default: {
          input: { focused: { borderColor: theme.focusColor } },
        },
      },
    }));

    expect(adapter({ mode: "dark", focusColor: "cyan" })).toEqual({
      theme: "midnight",
      styles: {
        default: {
          input: { focused: { borderColor: "cyan" } },
        },
      },
    });

    const guardedAdapter = defineFinixHostedAppearanceAdapter<AppTheme>()(() => output);
    expect(guardedAdapter({ mode: "light", focusColor: "blue" })).toBe(output);

    Reflect.set(output, "paymentMethods", ["card"]);
    expect(() => guardedAdapter({ mode: "light", focusColor: "blue" })).toThrowError(
      expect.objectContaining({
        code: "invalid_configuration",
        message: "Unknown hosted appearance option: paymentMethods.",
      }),
    );
  });

  it("deeply merges targets, states, and individual CSS properties in source order", () => {
    const foundation = defineFinixStyles({
      default: {
        input: {
          default: { backgroundColor: "white", border: "1px solid gray", borderRadius: 4 },
          focused: { borderColor: "blue" },
        },
        section: { default: { padding: 8 } },
      },
      dark: {
        input: { default: { backgroundColor: "black", color: "white" } },
      },
    });
    const brand = defineFinixStyles({
      default: {
        input: {
          default: { borderRadius: 12, color: "navy" },
          error: { borderColor: "crimson" },
        },
        submitButton: { default: { backgroundColor: "navy" } },
      },
      dark: {
        input: { default: { color: "ivory" } },
      },
    });

    expect(mergeFinixStyles(foundation, undefined, brand)).toEqual({
      default: {
        input: {
          default: {
            backgroundColor: "white",
            border: "1px solid gray",
            borderRadius: 12,
            color: "navy",
          },
          error: { borderColor: "crimson" },
          focused: { borderColor: "blue" },
        },
        section: { default: { padding: 8 } },
        submitButton: { default: { backgroundColor: "navy" } },
      },
      dark: {
        input: { default: { backgroundColor: "black", color: "ivory" } },
      },
    });
    expect(foundation.default?.input?.default?.borderRadius).toBe(4);
    expect(mergeFinixStyles()).toEqual({});
    expect(mergeFinixStyles({ default: {}, dark: {} })).toEqual({});
  });

  it("rejects unsupported runtime style shapes at the definition boundary", () => {
    const invalidStyles: unknown = {
      default: {
        iframe: {
          default: { color: "red" },
        },
      },
    };

    expect(() => {
      // @ts-expect-error Exercise the runtime boundary with an unknown value.
      defineFinixStyles(invalidStyles);
    }).toThrowError(FinixSdkError);
  });

  it("rejects structure options at the hosted-appearance runtime boundary", () => {
    const invalidAppearance: unknown = {
      theme: "finix",
      showAddress: true,
    };

    expect(() => {
      // @ts-expect-error Exercise the runtime boundary with an unknown value.
      defineFinixHostedAppearance(invalidAppearance);
    }).toThrowError(
      expect.objectContaining({
        code: "invalid_configuration",
        message: "Unknown hosted appearance option: showAddress.",
      }),
    );
  });

  it.each([NaN, Infinity, -Infinity])("rejects non-finite CSS number %s", (value) => {
    expect(() =>
      defineFinixStyles({
        default: {
          input: { default: { opacity: value } },
        },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "invalid_configuration",
        message: "styles.default.input.default.opacity must be a string or finite number.",
      }),
    );
  });

  it("treats bare target styles as the default mode", () => {
    const bare = defineFinixStyles({ input: { default: { padding: "12px" } } });
    expect(bare).toEqual({ default: { input: { default: { padding: "12px" } } } });
    const explicit = defineFinixStyles({ dark: { input: { default: { color: "#fff" } } } });
    expect(explicit).toEqual({ dark: { input: { default: { color: "#fff" } } } });
    expect(mergeFinixStyles({ input: { default: { padding: "12px" } } }, { default: { input: { default: { color: "#000" } } } })).toEqual({
      default: { input: { default: { padding: "12px", color: "#000" } } },
    });
    expect(() => defineFinixStyles({ input: { default: { padding: "12px" } }, dark: {} } as never)).toThrow(FinixSdkError);
  });

  it("flattens an appearance for the app's color scheme", () => {
    const appearance = defineFinixHostedAppearance({
      labels: { card_holder_name: "Name on card" },
      styles: {
        default: { input: { default: { padding: "12px", color: "#111" } } },
        dark: { input: { default: { color: "#eee" }, focused: { borderColor: "#7fb0f5" } } },
      },
    });

    expect(resolveFinixAppearance(appearance, "light")).toEqual({
      labels: { card_holder_name: "Name on card" },
      enableDarkMode: false,
      styles: { default: { input: { default: { padding: "12px", color: "#111" } } } },
    });
    expect(resolveFinixAppearance(appearance, "dark")).toEqual({
      labels: { card_holder_name: "Name on card" },
      enableDarkMode: true,
      styles: { default: { input: { default: { padding: "12px", color: "#eee" }, focused: { borderColor: "#7fb0f5" } } } },
    });
    expect(resolveFinixAppearance({ theme: "sapphire" }, "dark")).toEqual({ theme: "sapphire", enableDarkMode: true });
    expect(appearance.styles?.dark).toBeDefined();
  });
});
