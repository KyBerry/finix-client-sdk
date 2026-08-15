import javascript from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import type { TSESLint } from "@typescript-eslint/utils";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

import { config as baseConfig } from "./base.ts";

const reactRecommended = pluginReact.configs.flat.recommended;
if (!reactRecommended) {
  throw new Error("eslint-plugin-react does not expose its recommended flat configuration.");
}

/** Typed ESLint configuration for Next.js applications. */
export const nextConfig = [
  ...baseConfig,
  javascript.configs.recommended,
  eslintConfigPrettier,
  ...typescriptEslint.configs.recommended,
  {
    ...reactRecommended,
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
] satisfies TSESLint.FlatConfig.ConfigArray;
