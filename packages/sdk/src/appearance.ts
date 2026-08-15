import type {
  FinixColorScheme,
  FinixCssProperties,
  FinixHostedAppearance,
  FinixPaymentFormOptions,
  FinixStyles,
  FinixStylesInput,
  FinixStyleStates,
  FinixThemeStyles,
} from "./types";
import { validateHostedAppearance, validatePaymentFormOptions } from "./validation";

const FORM_STATES = ["default", "error", "success", "focused"] as const;
const INPUT_STATES = ["default", "error", "success", "focused"] as const;
const SECTION_HEADER_STATES = ["default", "focused"] as const;
const SECTION_STATES = ["default"] as const;
const SUBMIT_BUTTON_STATES = ["default", "disabled"] as const;

type ExactHostedAppearance<Appearance extends FinixHostedAppearance> = Appearance &
  Record<Exclude<keyof Appearance, keyof FinixHostedAppearance>, never>;

const STYLE_MODES = ["default", "dark"] as const;
const STYLE_TARGETS = ["form", "input", "sectionHeader", "section", "submitButton"] as const;

/**
 * `{ input: {...} }` becomes `{ default: { input: {...} } }`; anything already
 * keyed by mode is returned as-is.
 */
export type NormalizedFinixStyles<Styles extends FinixStylesInput> =
  Extract<keyof Styles, (typeof STYLE_MODES)[number]> extends never ? { default: Styles } : Styles;

function isBareThemeStyles(styles: FinixStylesInput): styles is FinixThemeStyles {
  // An empty object is also "bare" so runtime matches NormalizedFinixStyles<{}>.
  return Object.keys(styles).every((key) => (STYLE_TARGETS as readonly string[]).includes(key));
}

/** Accepts either style shape and returns the mode-keyed one Finix expects. */
export function normalizeFinixStyles<const Styles extends FinixStylesInput>(styles: Styles): NormalizedFinixStyles<Styles> {
  return (isBareThemeStyles(styles) ? { default: styles } : styles) as NormalizedFinixStyles<Styles>;
}

/**
 * Defines a reusable Finix style object while preserving literal values for
 * editor autocomplete. Accepts `{ default, dark }` or a bare `{ input, form, ... }`
 * object (treated as the default mode). Runtime validation matches FinixClient.mount().
 */
export function defineFinixStyles<const Styles extends FinixStylesInput>(styles: Styles): NormalizedFinixStyles<Styles> {
  const normalized = normalizeFinixStyles(styles);
  validatePaymentFormOptions({ styles: normalized as FinixStyles });
  return normalized;
}

/** Defines a reusable set of documented hosted-iframe appearance options. */
export function defineFinixHostedAppearance<const Appearance extends FinixHostedAppearance>(
  appearance: ExactHostedAppearance<Appearance>,
): Appearance {
  validateHostedAppearance(appearance);
  return appearance;
}

/**
 * Creates a strongly typed bridge from an application theme to Finix's hosted
 * iframe appearance. Every generated appearance is runtime validated.
 */
export function defineFinixHostedAppearanceAdapter<AppTheme>() {
  return <const Appearance extends FinixHostedAppearance>(
    adapter: (theme: AppTheme) => ExactHostedAppearance<Appearance>,
  ): ((theme: AppTheme) => Appearance) => {
    return (theme: AppTheme): Appearance => {
      const appearance = adapter(theme);
      validateHostedAppearance(appearance);
      return appearance;
    };
  };
}

/** Defines complete form options without widening literal tuples or labels. */
export function defineFinixPaymentFormOptions<const Options extends FinixPaymentFormOptions>(options: Options): Options {
  validatePaymentFormOptions(options);
  return options;
}

function mergeStateGroup<State extends string>(
  groups: readonly (FinixStyleStates<State> | undefined)[],
  states: readonly State[],
): FinixStyleStates<State> | undefined {
  const merged: FinixStyleStates<State> = {};
  let hasProperties = false;

  for (const state of states) {
    let stateProperties: FinixCssProperties | undefined;
    for (const group of groups) {
      const properties = group?.[state];
      if (properties) {
        stateProperties = { ...stateProperties, ...properties };
      }
    }
    if (stateProperties) {
      merged[state] = stateProperties;
      hasProperties = true;
    }
  }

  return hasProperties ? merged : undefined;
}

function mergeThemeStyles(themes: readonly (FinixThemeStyles | undefined)[]): FinixThemeStyles | undefined {
  const form = mergeStateGroup(
    themes.map((theme) => theme?.form),
    FORM_STATES,
  );
  const input = mergeStateGroup(
    themes.map((theme) => theme?.input),
    INPUT_STATES,
  );
  const sectionHeader = mergeStateGroup(
    themes.map((theme) => theme?.sectionHeader),
    SECTION_HEADER_STATES,
  );
  const section = mergeStateGroup(
    themes.map((theme) => theme?.section),
    SECTION_STATES,
  );
  const submitButton = mergeStateGroup(
    themes.map((theme) => theme?.submitButton),
    SUBMIT_BUTTON_STATES,
  );

  if (!form && !input && !sectionHeader && !section && !submitButton) {
    return undefined;
  }

  return {
    ...(form ? { form } : {}),
    ...(input ? { input } : {}),
    ...(sectionHeader ? { sectionHeader } : {}),
    ...(section ? { section } : {}),
    ...(submitButton ? { submitButton } : {}),
  };
}

/**
 * Deeply composes Finix iframe styles in source order. Later sources override
 * individual CSS properties without erasing sibling targets or states.
 */
export function mergeFinixStyles(...sources: readonly (FinixStylesInput | undefined)[]): FinixStyles {
  const definedSources = sources
    .filter((source): source is FinixStylesInput => source !== undefined)
    .map((source) => normalizeFinixStyles(source) as FinixStyles);
  for (const styles of definedSources) {
    validatePaymentFormOptions({ styles });
  }

  const defaultStyles = mergeThemeStyles(definedSources.map((styles) => styles.default));
  const darkStyles = mergeThemeStyles(definedSources.map((styles) => styles.dark));

  return {
    ...(defaultStyles ? { default: defaultStyles } : {}),
    ...(darkStyles ? { dark: darkStyles } : {}),
  };
}

/**
 * Flattens an appearance for the color scheme your app is currently showing.
 * Finix only applies `styles.dark` when the iframe's own prefers-color-scheme
 * is dark, which cannot follow an in-app theme toggle. This folds `styles.dark`
 * over `styles.default` when `scheme` is "dark" (and sets `enableDarkMode`),
 * or drops it when "light", so one appearance object serves both schemes.
 * Mount with a new instanceKey when the scheme changes; see useFinixAppearance.
 */
export function resolveFinixAppearance<const Appearance extends FinixHostedAppearance>(
  appearance: Appearance,
  scheme: FinixColorScheme,
): Omit<Appearance, "styles" | "enableDarkMode"> & { styles?: FinixStyles; enableDarkMode: boolean } {
  validateHostedAppearance(appearance);
  const { styles, enableDarkMode: _ignored, ...rest } = appearance;
  const dark = scheme === "dark";
  const flattened = styles
    ? mergeFinixStyles({ default: styles.default }, dark ? { default: styles.dark } : undefined)
    : undefined;
  return {
    ...rest,
    enableDarkMode: dark,
    ...(flattened && Object.keys(flattened).length > 0 ? { styles: flattened } : {}),
  };
}
