import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import packageJson from "./package.json" with { type: "json" };

const externalPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/react.ts"),
      },
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: (id) => [...externalPackages].some((packageName) => id === packageName || id.startsWith(`${packageName}/`)),
    },
    target: "es2020",
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [
    dts({
      entryRoot: "src",
      outDir: "dist",
      tsconfigPath: "tsconfig.json",
      exclude: ["src/**/__tests__/**", "src/**/*.test.ts", "src/**/*.test.tsx"],
    }),
  ],
});
