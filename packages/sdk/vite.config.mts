import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import packageJson from "./package.json" with { type: "json" };

// Use defineConfig for type hints
export default defineConfig({
  build: {
    // Configure Vite for library mode
    lib: {
      // Specify the entry point for the library
      entry: resolve(__dirname, "src/index.ts"),
      // The name of the global variable when using UMD format
      name: "FinixClientSDK",
      // Specify the output file name formats (without extensions)
      // Vite automatically generates .js and .mjs based on formats
      fileName: (format) => `index.${format === "es" ? "esm" : format}.js`,
      // Specify the output formats (ES Module and UMD)
      formats: ["es", "umd"],
    },
    // Configure Rollup options for more control
    rollupOptions: {
      // Define external dependencies that shouldn't be bundled
      // React is a peer dependency, so it should be external
      external: [...Object.keys(packageJson.peerDependencies || {})],
      output: {
        // Configure UMD specific options
        globals: {
          // Map external dependencies to global variables if needed for UMD
          // react: 'React', // Example if React was needed globally
        },
      },
    },
    // Enable sourcemaps for debugging
    sourcemap: true,
    // Empty the output directory before building
    emptyOutDir: true,
  },
  // Add the dts plugin for generating TypeScript declaration files
  plugins: [
    dts({
      // Specify the entry root directory (usually src)
      entryRoot: "src",
      // Specify the output directory for declaration files
      // Should match the 'types' field in package.json directory
      outDir: "dist",
      // Optionally specify the tsconfig file to use
      // tsconfigPath: 'tsconfig.json'
    }),
  ],
});
