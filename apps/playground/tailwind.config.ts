import type { Config } from "tailwindcss";

import sharedConfig from "@kyberry/ui/tailwind.config";

const config = {
  ...sharedConfig,
  darkMode: "media",
  content: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "../../packages/ui/src/components/**/*.{ts,tsx}",
  ],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme.extend,
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
} satisfies Config;

export default config;
