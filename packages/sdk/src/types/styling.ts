import type { Properties } from "csstype";

/**
 * Comprehensive type for CSS style properties
 * Using csstype library for complete CSS property typing
 */
export type StyleOptions = Properties<string | number>;

/**
 * Style configuration for different form states
 */
export type StylesConfig = {
  /** Base styles for all fields */
  default?: StyleOptions;
  /** Styles applied when a field is valid */
  success?: StyleOptions;
  /** Styles applied when a field has errors */
  error?: StyleOptions;
};

/**
 * Supported font formats
 */
export type FontFormat = "woff" | "woff2" | "ttf" | "otf" | "eot";

/**
 * Configuration for custom fonts
 */
export type FontConfig = {
  /** Font family name to reference in CSS */
  fontFamily: string;
  /** HTTPS URL to the font file */
  url: string;
  /** Format of the font file */
  format: FontFormat;
};
