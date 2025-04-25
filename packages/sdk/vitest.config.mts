import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true, // Use Vitest's global APIs
    environment: "jsdom", // Simulate a browser environment
    setupFiles: [], // Add setup files if needed (e.g., polyfills)
    coverage: {
      provider: "v8", // or 'istanbul'
      reporter: ["text", "json", "html"], // Coverage report formats
      reportsDirectory: "./coverage", // Output directory for reports
      include: ["src/**/*"], // Files to include in coverage
      exclude: [
        // Files/patterns to exclude
        "src/types/**/*",
        "src/constants.ts",
        "src/index.ts", // Entry point, usually not directly tested
        "**/node_modules/**",
        "**/dist/**",
        "**/__tests__/**", // Test files themselves
        "**/*.test.ts", // Test files themselves
        "**/*.spec.ts", // Test files themselves
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Match tsconfig alias
    },
  },
});
