declare module "eslint-config-prettier" {
  import type { TSESLint } from "@typescript-eslint/utils";

  const config: TSESLint.FlatConfig.Config;
  export default config;
}

declare module "eslint-plugin-only-warn" {
  import type { TSESLint } from "@typescript-eslint/utils";

  const plugin: TSESLint.FlatConfig.Plugin;
  export default plugin;
}

declare module "eslint-plugin-react-hooks" {
  import type { TSESLint } from "@typescript-eslint/utils";

  const plugin: TSESLint.FlatConfig.Plugin & {
    configs: {
      recommended: {
        rules: TSESLint.FlatConfig.Rules;
      };
    };
  };
  export default plugin;
}

declare module "@next/eslint-plugin-next" {
  import type { TSESLint } from "@typescript-eslint/utils";

  const plugin: TSESLint.FlatConfig.Plugin & {
    configs: {
      recommended: {
        rules: TSESLint.FlatConfig.Rules;
      };
      "core-web-vitals": {
        rules: TSESLint.FlatConfig.Rules;
      };
    };
  };
  export default plugin;
}
