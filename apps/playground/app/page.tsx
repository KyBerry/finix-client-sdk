"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Check, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";

import {
  defineFinixHostedAppearanceAdapter,
  defineFinixPaymentFormOptions,
  FinixClient,
  type FinixCssProperties,
  type FinixFormState,
  type FinixStyleStates,
  type FinixTokenResponse,
} from "@kyberry/finix-client-sdk";
import { FinixForm, type UseFinixPaymentFormResult } from "@kyberry/finix-client-sdk/react";

const applicationId = process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID;

/* ------------------------------------------------------------------------- *
 * Merchant presets
 *
 * Each preset is a complete merchant identity: card chrome, type, and radius
 * outside the iframe, plus the hosted palette and a custom font the SDK
 * forwards into Finix's frame. Presets are starting points — the sidebar's
 * accent and radius controls edit the active one, and the frame rebuilds
 * with the edited styles.
 * ------------------------------------------------------------------------- */

interface MerchantPalette {
  card: string;
  cardBorder: string;
  panel: string;
  panelBorder: string;
  field: string;
  fieldBorder: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  danger: string;
  dangerInk: string;
  dangerSoft: string;
  success: string;
  successInk: string;
  successSoft: string;
  ring: string;
}

interface MerchantTheme {
  label: string;
  descriptor: string;
  /** CSS variable set up in layout.tsx via next/font. */
  fontVariable: string;
  /** The same family, loaded inside Finix's iframe via the fonts option. */
  iframeFontFamily: string;
  /** Immutable latin-subset woff2 from fonts.gstatic.com. */
  iframeFontUrl: string;
  iframeFontFallback: string;
  radiusField: string;
  radiusCard: string;
  light: MerchantPalette;
  dark: MerchantPalette;
}

const merchantThemeIds = ["midnight", "ledger", "grove"] as const;
type MerchantThemeId = (typeof merchantThemeIds)[number];

const merchantThemes = {
  midnight: {
    label: "Midnight",
    descriptor: "instrument fintech",
    fontVariable: "var(--font-plex)",
    iframeFontFamily: "IBM Plex Sans",
    iframeFontUrl:
      "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD6llDB6g4tIOm6_De.woff2",
    iframeFontFallback: '"Helvetica Neue", Arial, sans-serif',
    radiusField: "10px",
    radiusCard: "18px",
    light: {
      card: "#ffffff",
      cardBorder: "#d5dcea",
      panel: "#eef2fa",
      panelBorder: "#dbe2f0",
      field: "#ffffff",
      fieldBorder: "#c3cee2",
      ink: "#131d33",
      inkMuted: "#4d5b76",
      accent: "#2547dd",
      accentInk: "#ffffff",
      accentSoft: "#e4eafd",
      danger: "#bb3434",
      dangerInk: "#7e1f1f",
      dangerSoft: "#fbe9e9",
      success: "#0d7a58",
      successInk: "#08543d",
      successSoft: "#e0f4ec",
      ring: "rgba(37, 71, 221, 0.22)",
    },
    dark: {
      card: "#101a2e",
      cardBorder: "#263450",
      panel: "#0b1322",
      panelBorder: "#1f2c47",
      field: "#1a2740",
      fieldBorder: "#32415f",
      ink: "#edf2fb",
      inkMuted: "#9dabc6",
      accent: "#8ba3ff",
      accentInk: "#0a1128",
      accentSoft: "#1c2a4f",
      danger: "#ff8484",
      dangerInk: "#ffd1d1",
      dangerSoft: "#3c1a1f",
      success: "#5fd3a7",
      successInk: "#bff0dd",
      successSoft: "#12352a",
      ring: "rgba(139, 163, 255, 0.3)",
    },
  },
  ledger: {
    label: "Ledger",
    descriptor: "editorial storefront",
    fontVariable: "var(--font-fraunces)",
    iframeFontFamily: "Fraunces",
    iframeFontUrl:
      "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIchRuTCf7Tp05GNyXk.woff2",
    iframeFontFallback: "Georgia, 'Times New Roman', serif",
    radiusField: "4px",
    radiusCard: "8px",
    light: {
      card: "#fdf8ec",
      cardBorder: "#cfbd97",
      panel: "#f4ecd8",
      panelBorder: "#dccfae",
      field: "#fffdf6",
      fieldBorder: "#bfae87",
      ink: "#2b2113",
      inkMuted: "#6b5b40",
      accent: "#94431f",
      accentInk: "#fff8ec",
      accentSoft: "#f2e0c8",
      danger: "#a8382a",
      dangerInk: "#772218",
      dangerSoft: "#f6e3dd",
      success: "#566f3f",
      successInk: "#3c5227",
      successSoft: "#e8eeda",
      ring: "rgba(148, 67, 31, 0.22)",
    },
    dark: {
      card: "#1e1811",
      cardBorder: "#4c4028",
      panel: "#16110b",
      panelBorder: "#3a3020",
      field: "#2a2318",
      fieldBorder: "#55482e",
      ink: "#f6edd8",
      inkMuted: "#c9b48f",
      accent: "#e39a55",
      accentInk: "#241503",
      accentSoft: "#3c2c12",
      danger: "#ff9078",
      dangerInk: "#ffd6cb",
      dangerSoft: "#40201a",
      success: "#aacb84",
      successInk: "#d8eec0",
      successSoft: "#2b3a1c",
      ring: "rgba(227, 154, 85, 0.3)",
    },
  },
  grove: {
    label: "Grove",
    descriptor: "organic goods",
    fontVariable: "var(--font-nunito)",
    iframeFontFamily: "Nunito",
    iframeFontUrl:
      "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDGUmdTQ3j6zbXWjgeg.woff2",
    iframeFontFallback: '"Avenir Next", "Segoe UI", sans-serif',
    radiusField: "18px",
    radiusCard: "26px",
    light: {
      card: "#f9fdf9",
      cardBorder: "#bad6c0",
      panel: "#eaf4ec",
      panelBorder: "#cfe3d4",
      field: "#ffffff",
      fieldBorder: "#a9cbb2",
      ink: "#16301f",
      inkMuted: "#48664f",
      accent: "#177a4c",
      accentInk: "#ffffff",
      accentSoft: "#d8f0e1",
      danger: "#bb4450",
      dangerInk: "#832832",
      dangerSoft: "#f9e4e6",
      success: "#157a50",
      successInk: "#0c5638",
      successSoft: "#dbf2e5",
      ring: "rgba(23, 122, 76, 0.22)",
    },
    dark: {
      card: "#12211a",
      cardBorder: "#2c4a3a",
      panel: "#0c1710",
      panelBorder: "#22392c",
      field: "#1b2f24",
      fieldBorder: "#35553f",
      ink: "#ebf7ee",
      inkMuted: "#a3c2ad",
      accent: "#74dcaa",
      accentInk: "#06281a",
      accentSoft: "#1a3d2c",
      danger: "#ff8b95",
      dangerInk: "#ffd3d7",
      dangerSoft: "#3d1d22",
      success: "#74dcaa",
      successInk: "#c6f2dc",
      successSoft: "#17382a",
      ring: "rgba(116, 220, 170, 0.28)",
    },
  },
} satisfies Record<MerchantThemeId, MerchantTheme>;

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** White or near-black text, whichever is readable on the given background. */
function readableInk(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#111111" : "#ffffff";
}

interface ThemeOverrides {
  accent: string | null;
  radiusField: string | null;
}

function applyOverrides(base: MerchantTheme, overrides: ThemeOverrides): MerchantTheme {
  if (!overrides.accent && !overrides.radiusField) {
    return base;
  }
  const patchPalette = (palette: MerchantPalette): MerchantPalette =>
    overrides.accent
      ? {
          ...palette,
          accent: overrides.accent,
          accentInk: readableInk(overrides.accent),
          ring: hexToRgba(overrides.accent, 0.25),
        }
      : palette;
  return {
    ...base,
    radiusField: overrides.radiusField ?? base.radiusField,
    light: patchPalette(base.light),
    dark: patchPalette(base.dark),
  };
}

/* ------------------------------------------------------------------------- *
 * CSS-variable plumbing — theme.css owns the unsuffixed tokens.
 * ------------------------------------------------------------------------- */

const paletteVarKeys = {
  card: "card",
  cardBorder: "card-border",
  panel: "panel",
  panelBorder: "panel-border",
  field: "field",
  fieldBorder: "field-border",
  ink: "ink",
  inkMuted: "ink-muted",
  accent: "accent",
  accentInk: "accent-ink",
  accentSoft: "accent-soft",
  danger: "danger",
  dangerInk: "danger-ink",
  dangerSoft: "danger-soft",
  success: "success",
  successInk: "success-ink",
  successSoft: "success-soft",
  ring: "ring",
} as const satisfies Record<keyof MerchantPalette, string>;

function merchantVars(theme: MerchantTheme): CSSProperties {
  const vars: Record<string, string> = {
    "--m-font": theme.fontVariable,
    "--m-radius-field": theme.radiusField,
    "--m-radius-card": theme.radiusCard,
  };
  for (const [key, varKey] of Object.entries(paletteVarKeys) as [keyof MerchantPalette, string][]) {
    vars[`--m-${varKey}-light`] = theme.light[key];
    vars[`--m-${varKey}-dark`] = theme.dark[key];
  }
  return vars as CSSProperties;
}

function chipVars(theme: MerchantTheme): CSSProperties {
  return {
    "--chip-accent-light": theme.light.accent,
    "--chip-accent-dark": theme.dark.accent,
    "--chip-ink-light": theme.light.ink,
    "--chip-ink-dark": theme.dark.ink,
    "--chip-card-light": theme.light.card,
    "--chip-card-dark": theme.dark.card,
  } as CSSProperties;
}

/* Tool chrome: neutral application surfaces, system font stack. */
const SHELL_VARS: Record<string, string> = {
  "--s-bg-light": "#f2f3f5",
  "--s-ink-light": "#1f2328",
  "--s-muted-light": "#636c76",
  "--s-line-light": "#dcdfe3",
  "--s-chip-light": "#ffffff",
  "--s-red-light": "#1a7f37",
  "--s-bg-dark": "#101214",
  "--s-ink-dark": "#e7e9ec",
  "--s-muted-dark": "#9aa2ab",
  "--s-line-dark": "rgba(255, 255, 255, 0.12)",
  "--s-chip-dark": "#191c1f",
  "--s-red-dark": "#3fb950",
};

/* ------------------------------------------------------------------------- *
 * Hosted appearance — everything below the iframe boundary.
 * ------------------------------------------------------------------------- */

function frameFontStack(theme: MerchantTheme): string {
  return `'${theme.iframeFontFamily}', ${theme.iframeFontFallback}`;
}

function frameStyles(theme: MerchantTheme, palette: MerchantPalette): {
  form: FinixStyleStates<"default">;
  input: FinixStyleStates<"default" | "error" | "success" | "focused">;
  sectionHeader: FinixStyleStates<"default" | "focused">;
  section: FinixStyleStates<"default">;
} {
  const fontFamily = frameFontStack(theme);
  const input: FinixCssProperties = {
    backgroundColor: palette.field,
    border: `1px solid ${palette.fieldBorder}`,
    borderRadius: theme.radiusField,
    color: palette.ink,
    fontFamily,
    fontSize: "15px",
    padding: "12px 14px",
    boxShadow: "none",
  };
  return {
    form: {
      default: {
        backgroundColor: palette.panel,
        color: palette.ink,
        fontFamily,
        fontSize: "15px",
      },
    },
    input: {
      default: input,
      focused: {
        border: `1px solid ${palette.accent}`,
        boxShadow: `0 0 0 3px ${palette.ring}`,
      },
      error: {
        border: `1px solid ${palette.danger}`,
        boxShadow: `0 0 0 3px ${palette.dangerSoft}`,
        color: palette.ink,
      },
      success: {
        border: `1px solid ${palette.success}`,
        boxShadow: "none",
      },
    },
    sectionHeader: {
      default: {
        backgroundColor: "transparent",
        borderColor: palette.panelBorder,
        borderRadius: theme.radiusField,
        color: palette.inkMuted,
        fontFamily,
      },
      focused: {
        backgroundColor: palette.accentSoft,
        borderColor: palette.accent,
        color: palette.accent,
      },
    },
    section: {
      default: { backgroundColor: "transparent", borderColor: "transparent", padding: "0" },
    },
  };
}

const adaptMerchantTheme = defineFinixHostedAppearanceAdapter<MerchantTheme>()((theme) => ({
  theme: "finix",
  enableDarkMode: true,
  showLabels: true,
  showPlaceholders: true,
  hidePotentialIssueMessages: true,
  labels: {
    card_holder_name: "Name on card",
    number: "Card number",
    expiration_date: "Expiration date",
    security_code: "Security code",
  },
  placeholders: {
    card_holder_name: "Taylor Morgan",
    number: "1234 1234 1234 1234",
    expiration_date: "MM / YY",
    security_code: "CVV",
  },
  fonts: [
    {
      fontFamily: theme.iframeFontFamily,
      url: theme.iframeFontUrl,
      format: "woff2",
    },
  ],
  styles: {
    default: frameStyles(theme, theme.light),
    dark: frameStyles(theme, theme.dark),
  },
}));

function createPaymentOptions(theme: MerchantTheme) {
  return defineFinixPaymentFormOptions({
    paymentMethods: ["card"],
    showAddress: false,
    ...adaptMerchantTheme(theme),
  } as const);
}

/* ------------------------------------------------------------------------- *
 * Tool primitives
 * ------------------------------------------------------------------------- */

/* One fake field in the loading overlay, shaped like the real hosted rows: a
 * label bar over a 46px input box with a placeholder-hint bar inside, all in
 * the merchant's field tokens and radius. Heights and gaps mirror the hosted
 * form's measured row pitch so the crossfade lands on the real fields. */
function SkeletonField({ labelWidth, hintWidth }: { labelWidth: string; hintWidth: string }): JSX.Element {
  return (
    <div className="space-y-2.5">
      <div className={`h-2.5 ${labelWidth} rounded-full bg-[color:var(--m-field-border)] opacity-60`} />
      <div className="flex h-[46px] items-center rounded-[var(--m-radius-field)] border border-[color:var(--m-field-border)] bg-[color:var(--m-field)] px-3.5">
        <div className={`h-2 ${hintWidth} rounded-full bg-[color:var(--m-field-border)] opacity-50`} />
      </div>
    </div>
  );
}

function PanelHeader({ children }: { children: string }): JSX.Element {
  return <h2 className="text-xs font-semibold text-[color:var(--s-muted)]">{children}</h2>;
}

function ValueRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <dt className="text-[13px] text-[color:var(--s-muted)]">{label}</dt>
      <dd className="text-right font-mono text-xs text-[color:var(--s-ink)]">{children}</dd>
    </div>
  );
}

const FIELD_SHORT_LABELS: Record<string, string> = {
  name: "name",
  card_holder_name: "name",
  number: "number",
  expiration_date: "exp",
  security_code: "cvc",
  address_country: "country",
  "address.country": "country",
  address_postal_code: "zip",
  address_line1: "line1",
  address_line2: "line2",
  address_city: "city",
  address_region: "region",
};

function FieldStateGlyphs({ state }: { state: FinixFormState }): JSX.Element {
  const entries = Object.entries(state).filter(
    ([fieldName, field]) => field !== undefined && fieldName in FIELD_SHORT_LABELS,
  );
  if (entries.length === 0) {
    return <span className="text-[color:var(--s-muted)]">—</span>;
  }
  return (
    <span className="inline-flex flex-wrap justify-end gap-x-2.5 gap-y-1">
      {entries.map(([fieldName, field]) => {
        const short = FIELD_SHORT_LABELS[fieldName];
        const tone = field?.errors
          ? "text-red-600 dark:text-red-400"
          : field?.isDirty
            ? "text-[color:var(--s-ink)]"
            : "text-[color:var(--s-muted)]";
        return (
          <span key={fieldName} className={tone}>
            {short}
            {field?.errors ? "✕" : field?.isDirty ? "✓" : "·"}
          </span>
        );
      })}
    </span>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={SHELL_VARS as CSSProperties}
      className="shell-frame min-h-screen bg-[color:var(--s-bg)] text-[color:var(--s-ink)]"
    >
      {children}
    </div>
  );
}

function Toolbar({ detail }: { detail?: string }): JSX.Element {
  return (
    <header className="flex h-12 items-center justify-between gap-4 border-b border-[color:var(--s-line)] bg-[color:var(--s-chip)] px-4">
      <h1 className="text-[13px] font-semibold">Finix SDK playground</h1>
      <p className="flex items-center gap-2 font-mono text-[11px] text-[color:var(--s-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--s-red)]" aria-hidden="true" />
        sandbox{detail ? ` · ${detail}` : ""}
      </p>
    </header>
  );
}

export default function Page(): JSX.Element {
  if (!applicationId) {
    return <MissingApplicationId />;
  }

  return <ConfiguredPlayground applicationId={applicationId} />;
}

function MissingApplicationId(): JSX.Element {
  return (
    <ShellFrame>
      <Toolbar />
      <main className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-md border border-[color:var(--s-line)] bg-[color:var(--s-chip)] p-6">
          <h2 className="text-[15px] font-semibold">Connect a sandbox application</h2>
          <p role="alert" className="mt-2 text-[13px] leading-6 text-[color:var(--s-muted)]">
            Set{" "}
            <code className="rounded border border-[color:var(--s-line)] bg-[color:var(--s-bg)] px-1 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_FINIX_APPLICATION_ID
            </code>{" "}
            in <code className="font-mono text-xs">apps/playground/.env.local</code> to a sandbox
            Finix Application ID, then restart the dev server.
          </p>
        </div>
      </main>
    </ShellFrame>
  );
}

function ConfiguredPlayground({ applicationId }: { applicationId: string }): JSX.Element {
  const client = useMemo(
    () =>
      new FinixClient({
        environment: "sandbox",
        applicationId,
      }),
    [applicationId],
  );
  const [activeThemeId, setActiveThemeId] = useState<MerchantThemeId>("midnight");
  const [overrides, setOverrides] = useState<ThemeOverrides>({ accent: null, radiusField: null });
  const [accentDraft, setAccentDraft] = useState<string | null>(null);
  const [stageWidth, setStageWidth] = useState<"desktop" | "mobile">("desktop");
  const [frameNonce, setFrameNonce] = useState(0);
  const [frameInits, setFrameInits] = useState(0);
  const [token, setToken] = useState<FinixTokenResponse | null>(null);

  /* Color inputs fire continuously while dragging; commit after the hand
   * stops so each edit costs one frame rebuild, not dozens. */
  useEffect(() => {
    if (accentDraft === null) {
      return;
    }
    const timer = setTimeout(() => {
      setOverrides((current) => ({ ...current, accent: accentDraft }));
    }, 400);
    return () => clearTimeout(timer);
  }, [accentDraft]);

  const baseTheme = merchantThemes[activeThemeId];
  const activeTheme = useMemo(() => applyOverrides(baseTheme, overrides), [baseTheme, overrides]);
  const paymentOptions = useMemo(() => createPaymentOptions(activeTheme), [activeTheme]);
  const hasOverrides = overrides.accent !== null || overrides.radiusField !== null;
  const maskedApplicationId = `${applicationId.slice(0, 6)}…${applicationId.slice(-3)}`;
  const instanceKey = `${activeThemeId}#${frameNonce}#${overrides.accent ?? "-"}#${overrides.radiusField ?? "-"}`;

  const handleThemeChange = useCallback((nextThemeId: MerchantThemeId) => {
    setToken(null);
    setOverrides({ accent: null, radiusField: null });
    setAccentDraft(null);
    setActiveThemeId(nextThemeId);
  }, []);

  const resetOverrides = useCallback(() => {
    setToken(null);
    setOverrides({ accent: null, radiusField: null });
    setAccentDraft(null);
  }, []);

  const reloadFrame = useCallback(() => {
    setToken(null);
    setFrameNonce((nonce) => nonce + 1);
  }, []);

  const handleReady = useCallback(() => {
    setFrameInits((count) => count + 1);
  }, []);

  const handleTokenize = useCallback(async (submit: UseFinixPaymentFormResult["submit"]) => {
    setToken(null);
    try {
      setToken(await submit());
    } catch {
      // The headless controller exposes the normalized error for custom UI.
    }
  }, []);

  const accentValue = accentDraft ?? overrides.accent ?? baseTheme.light.accent;
  const radiusValue = parseInt(overrides.radiusField ?? baseTheme.radiusField, 10);
  const isMobileStage = stageWidth === "mobile";

  return (
    <ShellFrame>
      <Toolbar detail={maskedApplicationId} />

      <FinixForm.Root client={client} options={paymentOptions} instanceKey={instanceKey} onReady={handleReady}>
        <div className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="border-b border-[color:var(--s-line)] bg-[color:var(--s-chip)] px-4 py-5 lg:min-h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r">
            <div className="space-y-7">
              <section>
                <PanelHeader>Preset</PanelHeader>
                <div role="group" aria-label="Merchant preset" className="mt-2 -space-y-px">
                  {merchantThemeIds.map((themeId) => {
                    const theme = merchantThemes[themeId];
                    const isActive = themeId === activeThemeId;
                    return (
                      <button
                        key={themeId}
                        type="button"
                        aria-pressed={isActive}
                        data-theme-preset={themeId}
                        onClick={() => handleThemeChange(themeId)}
                        style={chipVars(theme)}
                        className={`preset-chip flex w-full items-center gap-2.5 border px-2.5 py-2 text-left transition-colors first:rounded-t-md last:rounded-b-md focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500 ${
                          isActive
                            ? "relative z-[1] border-[color:var(--s-ink)] bg-[color:var(--s-bg)]"
                            : "border-[color:var(--s-line)] hover:bg-[color:var(--s-bg)]"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                            isActive ? "border-[color:var(--s-ink)]" : "border-[color:var(--s-muted)]"
                          }`}
                        >
                          {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--s-ink)]" /> : null}
                        </span>
                        <span
                          aria-hidden="true"
                          style={{ fontFamily: theme.fontVariable }}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[color:var(--s-line)] bg-[color:var(--chip-card)] text-xs font-semibold text-[color:var(--chip-accent)]"
                        >
                          Ag
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{theme.label}</span>
                          <span className="block truncate text-[11px] text-[color:var(--s-muted)]">
                            {theme.descriptor}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <PanelHeader>Appearance</PanelHeader>
                  {hasOverrides ? (
                    <button
                      type="button"
                      onClick={resetOverrides}
                      className="text-[11px] text-[color:var(--s-muted)] underline underline-offset-2 hover:text-[color:var(--s-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
                <dl className="mt-1">
                  <ValueRow label="accent">
                    <span className="inline-flex items-center gap-1.5">
                      <input
                        type="color"
                        aria-label="Accent color"
                        value={accentValue}
                        onChange={(event) => setAccentDraft(event.target.value)}
                        className="h-6 w-8 cursor-pointer rounded border border-[color:var(--s-line)] bg-transparent p-0.5"
                      />
                      {accentValue}
                    </span>
                  </ValueRow>
                  <ValueRow label="borderRadius">
                    <span className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        aria-label="Field border radius in pixels"
                        min={0}
                        max={28}
                        value={Number.isNaN(radiusValue) ? 0 : radiusValue}
                        onChange={(event) => {
                          const next = Math.max(0, Math.min(28, Number(event.target.value) || 0));
                          setToken(null);
                          setOverrides((current) => ({ ...current, radiusField: `${next}px` }));
                        }}
                        className="h-6 w-14 rounded border border-[color:var(--s-line)] bg-transparent px-1.5 text-right font-mono text-xs"
                      />
                      px
                    </span>
                  </ValueRow>
                  <ValueRow label="fonts[0]">{activeTheme.iframeFontFamily}</ValueRow>
                </dl>
                <p className="mt-1.5 text-[11px] leading-4 text-[color:var(--s-muted)]">
                  Edits rebuild the hosted frame — Finix fixes options at mount.
                </p>
              </section>

              <FinixForm.Consumer>
                {(controller) => (
                  <section>
                    <PanelHeader>Controller</PanelHeader>
                    <dl className="mt-1">
                      <ValueRow label="status">
                        <span className={controller.status === "ready" ? "" : "text-[color:var(--s-red)]"}>
                          {controller.status}
                        </span>
                      </ValueRow>
                      <ValueRow label="frame">
                        #{frameInits} · js.finix.com
                      </ValueRow>
                      <ValueRow label="state">
                        <FieldStateGlyphs state={controller.state} />
                      </ValueRow>
                      <ValueRow label="binInformation">
                        {controller.binInformation.cardBrand?.toLowerCase() ?? "—"}
                      </ValueRow>
                      <ValueRow label="token">
                        {token ? `${token.data.id.slice(0, 12)}…` : "—"}
                      </ValueRow>
                    </dl>
                  </section>
                )}
              </FinixForm.Consumer>

              <section className="border-t border-[color:var(--s-line)] pt-4">
                <ul className="space-y-2 text-[11px] leading-4 text-[color:var(--s-muted)]">
                  <li>Card data renders inside an iframe from js.finix.com; this page never sees it.</li>
                  <li>Placeholder color is the browser default — the hosted runtime exposes no hook for it.</li>
                  <li>Sandbox tokens are test-scoped; no charges occur.</li>
                </ul>
              </section>
            </div>
          </aside>

          <main className="px-4 py-8 sm:px-8 lg:py-10">
            <div
              className={`mx-auto transition-[max-width] duration-300 ${isMobileStage ? "max-w-[24rem]" : "max-w-[44rem]"}`}
            >
              <div className="overflow-hidden rounded-lg border border-[color:var(--s-line)] bg-[color:var(--s-chip)] shadow-sm">
                <div className="flex items-center gap-3 border-b border-[color:var(--s-line)] px-3 py-2">
                  <span aria-hidden="true" className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--s-line)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--s-line)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--s-line)]" />
                  </span>
                  <span className="mx-auto w-full max-w-[16rem] truncate rounded bg-[color:var(--s-bg)] px-2.5 py-1 text-center font-mono text-[11px] text-[color:var(--s-muted)]">
                    yourstore.example/checkout
                  </span>
                  <span aria-hidden="true" className="w-9" />
                </div>

                <div
                  style={merchantVars(activeTheme)}
                  className="merchant-stage bg-[color:var(--m-panel)] p-4 font-[family-name:var(--m-font)] transition-colors duration-300 sm:p-6"
                >
                  <section className="relative rounded-[var(--m-radius-card)] border border-[color:var(--m-card-border)] bg-[color:var(--m-card)] p-5 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.4)] transition-all duration-300 sm:p-7">
                    <div className="mb-6 flex items-start justify-between gap-6 border-b border-[color:var(--m-panel-border)] pb-5">
                      <div>
                        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[color:var(--m-ink)]">
                          Payment details
                        </h2>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--m-accent)] text-[color:var(--m-accent-ink)] transition-colors duration-300">
                        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>

                    <FinixForm.Consumer>
                      {(controller) => {
                        const reportedError = controller.submissionError ?? controller.error;
                        const isReady = controller.status === "ready";
                        const isLoading = controller.status === "idle" || controller.status === "loading";
                        return (
                          <>
                            <div className="mb-5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-xs text-[color:var(--m-ink-muted)]">
                                <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Secure hosted fields</span>
                              </div>
                              <span
                                aria-live="polite"
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-300 ${
                                  isReady
                                    ? "border-[color:var(--m-success)] bg-[color:var(--m-success-soft)] text-[color:var(--m-success-ink)]"
                                    : controller.status === "error"
                                      ? "border-[color:var(--m-danger)] bg-[color:var(--m-danger-soft)] text-[color:var(--m-danger-ink)]"
                                      : "border-[color:var(--m-accent)] bg-[color:var(--m-accent-soft)] text-[color:var(--m-ink)]"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {isReady ? "Frame ready" : controller.status}
                              </span>
                            </div>

                            {reportedError ? (
                              <div
                                role="alert"
                                className="mb-4 flex items-start justify-between gap-4 rounded-[var(--m-radius-field)] border border-[color:var(--m-danger)] bg-[color:var(--m-danger-soft)] px-4 py-3 text-sm text-[color:var(--m-danger-ink)]"
                              >
                                <p className="leading-6">{reportedError.message}</p>
                                {controller.status === "error" ? (
                                  <button
                                    type="button"
                                    onClick={reloadFrame}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--m-danger)] px-2.5 py-1 text-xs font-medium transition hover:bg-[color:var(--m-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--m-danger)]"
                                  >
                                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                                    Reload frame
                                  </button>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="relative">
                              <FinixForm.Host
                                role="group"
                                className={`rounded-[var(--m-radius-field)] border border-[color:var(--m-panel-border)] bg-[color:var(--m-panel)] p-4 transition-all duration-300 ${
                                  isMobileStage ? "min-h-[29.5rem]" : "min-h-[29.5rem] sm:min-h-[21rem]"
                                }`}
                                aria-label="Secure payment fields"
                              />
                              {/* Stays mounted so the ready state dissolves over
                                  the live fields instead of popping; the fade also
                                  covers the iframe's own first paint. */}
                              <div
                                aria-hidden="true"
                                className={`pointer-events-none absolute inset-0 rounded-[var(--m-radius-field)] border border-[color:var(--m-panel-border)] bg-[color:var(--m-panel)] p-4 transition-opacity duration-500 ${
                                  isLoading ? "opacity-100" : "opacity-0"
                                }`}
                              >
                                <div className={`space-y-2.5 ${isLoading ? "motion-safe:animate-pulse" : ""}`}>
                                  <SkeletonField labelWidth="w-24" hintWidth="w-28" />
                                  <SkeletonField labelWidth="w-28" hintWidth="w-40" />
                                  <div
                                    className={`grid gap-x-4 gap-y-2.5 ${isMobileStage ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
                                  >
                                    <SkeletonField labelWidth="w-24" hintWidth="w-14" />
                                    <SkeletonField labelWidth="w-20" hintWidth="w-10" />
                                  </div>
                                  <div
                                    className={`grid gap-x-4 gap-y-2.5 ${isMobileStage ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
                                  >
                                    <SkeletonField labelWidth="w-16" hintWidth="w-12" />
                                    <SkeletonField labelWidth="w-10" hintWidth="w-10" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!controller.canSubmit}
                              onClick={() => void handleTokenize(controller.submit)}
                              className="group mt-5 flex min-h-12 w-full items-center justify-between rounded-[var(--m-radius-field)] bg-[color:var(--m-accent)] px-5 py-3.5 text-sm font-semibold text-[color:var(--m-accent-ink)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--m-accent)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border disabled:border-[color:var(--m-panel-border)] disabled:bg-[color:var(--m-panel)] disabled:text-[color:var(--m-ink-muted)]"
                            >
                              <span>{controller.isSubmitting ? "Creating secure token…" : "Create payment token"}</span>
                              <ArrowRight
                                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0"
                                aria-hidden="true"
                              />
                            </button>

                            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[color:var(--m-ink-muted)]">
                              <Check
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--m-success)]"
                                aria-hidden="true"
                              />
                              <span>
                                {controller.canSubmit
                                  ? "Hosted validation passed. The form is ready to tokenize."
                                  : "The action unlocks after the hosted fields pass validation."}
                              </span>
                            </div>
                          </>
                        );
                      }}
                    </FinixForm.Consumer>
                  </section>

                  {/* The live region stays mounted so screen readers announce the
                      token when it arrives; a region inserted together with its
                      content is not reliably announced. */}
                  <div aria-live="polite">
                    {token ? (
                      <section className="relative mt-5 rounded-[var(--m-radius-card)] border border-[color:var(--m-success)] bg-[color:var(--m-success-soft)] p-5 text-[color:var(--m-success-ink)]">
                        <p className="text-xs font-medium">Short-lived token generated</p>
                        <p className="mt-3 break-all rounded-[var(--m-radius-field)] bg-[color:var(--m-card)] px-3 py-2 font-mono text-xs text-[color:var(--m-ink)]">
                          {token.data.id}
                        </p>
                        <p className="mt-3 text-xs leading-5">
                          Send this token to your backend and claim the Payment Instrument immediately.
                        </p>
                      </section>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div
                  role="group"
                  aria-label="Stage width"
                  className="inline-flex overflow-hidden rounded-md border border-[color:var(--s-line)]"
                >
                  {(["desktop", "mobile"] as const).map((width) => (
                    <button
                      key={width}
                      type="button"
                      aria-pressed={stageWidth === width}
                      onClick={() => setStageWidth(width)}
                      className={`px-3 py-1.5 text-xs capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 ${
                        stageWidth === width
                          ? "bg-[color:var(--s-chip)] font-medium"
                          : "text-[color:var(--s-muted)] hover:bg-[color:var(--s-chip)]"
                      }`}
                    >
                      {width}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[color:var(--s-muted)]">
                  Standard test card numbers work in sandbox.
                </p>
              </div>
            </div>
          </main>
        </div>
      </FinixForm.Root>
    </ShellFrame>
  );
}
