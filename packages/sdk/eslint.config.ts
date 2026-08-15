import type { TSESLint } from "@typescript-eslint/utils";
import globals from "globals";

import { config as reactConfig } from "@kyberry/eslint-config/react-internal";

const vitestGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  test: "readonly",
  vi: "readonly",
} as const;

const sdkEslintConfig: TSESLint.FlatConfig.ConfigArray = [
  ...reactConfig,
  {
    files: ["src/**/__tests__/**/*.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
    languageOptions: {
      globals: vitestGlobals,
    },
  },
  {
    files: ["*.config.mts", "scripts/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ignores: ["coverage/**", "dist/**"],
  },
];

export default sdkEslintConfig;
