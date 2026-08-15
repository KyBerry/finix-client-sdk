import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = resolve(packageRoot, "../..");
const workspace = mkdtempSync(join(tmpdir(), "finix-client-sdk-pack-"));
const packDirectory = resolve(workspace, "pack");
const extractDirectory = resolve(workspace, "extract");
const consumerDirectory = resolve(workspace, "consumer");

const expectedFiles = [
  "LICENSE",
  "README.md",
  "dist/index.cjs",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/react.cjs",
  "dist/react.d.ts",
  "dist/react.js",
  "package.json",
] as const;

const exportSchema = z.object({
  types: z.string(),
  import: z.string(),
  require: z.string(),
  default: z.string(),
});
const manifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  private: z.boolean().optional(),
  exports: z.object({
    ".": exportSchema,
    "./react": exportSchema,
  }),
});

function listFiles(directory: string, prefix = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(resolve(directory, entry.name), relativePath) : [relativePath];
  });
}

function run(command: string, args: string[], cwd: string): void {
  const childEnvironment: NodeJS.ProcessEnv = { ...process.env, CI: "true" };
  delete childEnvironment.npm_config_recursive;
  execFileSync(command, args, {
    cwd,
    env: childEnvironment,
    stdio: "inherit",
  });
}

try {
  mkdirSync(packDirectory);
  mkdirSync(extractDirectory);
  mkdirSync(consumerDirectory);

  run("npm", ["pack", "--silent", "--pack-destination", packDirectory], packageRoot);
  const tarballs = readdirSync(packDirectory).filter((fileName) => fileName.endsWith(".tgz"));
  assert.equal(tarballs.length, 1, `Expected one package tarball, found ${tarballs.length}.`);
  const tarballName = tarballs[0];
  assert(tarballName, "The package tarball name is missing.");
  const tarballPath = resolve(packDirectory, tarballName);

  run("tar", ["-xzf", tarballPath, "-C", extractDirectory], packageRoot);
  const extractedPackage = resolve(extractDirectory, "package");
  const packedFiles = listFiles(extractedPackage).sort();
  for (const expectedFile of expectedFiles) {
    assert(packedFiles.includes(expectedFile), `Packed tarball is missing ${expectedFile}.`);
  }
  assert(!packedFiles.some((fileName) => fileName.startsWith("src/")), "Packed tarball must not contain source files.");
  assert(
    !packedFiles.some((fileName) => fileName.includes("__tests__") || fileName.includes(".test.")),
    "Packed tarball must not contain tests.",
  );

  const manifest = manifestSchema.parse(
    JSON.parse(readFileSync(resolve(extractedPackage, "package.json"), "utf8")),
  );
  assert.equal(manifest.private, undefined, "Published package must not be private.");
  assert.deepEqual(Object.keys(manifest.exports).sort(), [".", "./react"]);
  assert.equal(manifest.exports["."].import, "./dist/index.js");
  assert.equal(manifest.exports["."].require, "./dist/index.cjs");
  assert.equal(manifest.exports["./react"].import, "./dist/react.js");
  assert.equal(manifest.exports["./react"].require, "./dist/react.cjs");

  writeFileSync(
    resolve(consumerDirectory, "package.json"),
    `${JSON.stringify({ name: "finix-client-sdk-consumer-smoke", private: true, type: "module" }, null, 2)}\n`,
    "utf8",
  );
  run(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      tarballPath,
      "react@18.2.0",
      "@types/react@18.3.0",
    ],
    consumerDirectory,
  );

  const esmSmokePath = resolve(consumerDirectory, "consumer.mjs");
  writeFileSync(
    esmSmokePath,
    [
      'import assert from "node:assert/strict";',
      'import { FinixClient, createFinixAuth, defineFinixStyles, loadFinix, mergeFinixStyles } from "@kyberry/finix-client-sdk";',
      'import { FinixForm, FinixPaymentForm, useFinixPaymentForm } from "@kyberry/finix-client-sdk/react";',
      'for (const value of [FinixClient, createFinixAuth, defineFinixStyles, loadFinix, mergeFinixStyles, useFinixPaymentForm]) {',
      '  assert.equal(typeof value, "function");',
      '}',
      'for (const value of [FinixForm.Root, FinixForm.Host, FinixForm.Consumer, FinixPaymentForm]) {',
      '  assert(["function", "object"].includes(typeof value));',
      '}',
      "",
    ].join("\n"),
    "utf8",
  );
  run(process.execPath, [esmSmokePath], consumerDirectory);

  const cjsSmokePath = resolve(consumerDirectory, "consumer.cjs");
  writeFileSync(
    cjsSmokePath,
    [
      'const assert = require("node:assert/strict");',
      'const { FinixClient, createFinixAuth, defineFinixStyles, loadFinix, mergeFinixStyles } = require("@kyberry/finix-client-sdk");',
      'const { FinixForm, FinixPaymentForm, useFinixPaymentForm } = require("@kyberry/finix-client-sdk/react");',
      'for (const value of [FinixClient, createFinixAuth, defineFinixStyles, loadFinix, mergeFinixStyles, useFinixPaymentForm]) {',
      '  assert.equal(typeof value, "function");',
      '}',
      'for (const value of [FinixForm.Root, FinixForm.Host, FinixForm.Consumer, FinixPaymentForm]) {',
      '  assert(["function", "object"].includes(typeof value));',
      '}',
      "",
    ].join("\n"),
    "utf8",
  );
  run(process.execPath, [cjsSmokePath], consumerDirectory);

  const typeSmokePath = resolve(consumerDirectory, "consumer.ts");
  writeFileSync(
    typeSmokePath,
    [
      'import { FinixClient, createFinixAuth, defineFinixStyles, loadFinix, mergeFinixStyles } from "@kyberry/finix-client-sdk";',
      'import { FinixForm, FinixPaymentForm, useFinixPaymentForm } from "@kyberry/finix-client-sdk/react";',
      "void [FinixClient, createFinixAuth, defineFinixStyles, loadFinix, mergeFinixStyles, FinixForm, FinixPaymentForm, useFinixPaymentForm];",
      "",
    ].join("\n"),
    "utf8",
  );
  const typeConfigPath = resolve(consumerDirectory, "tsconfig.json");
  writeFileSync(
    typeConfigPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: "ES2022",
        },
        include: ["consumer.ts"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  const typescriptBin = resolve(repositoryRoot, "node_modules/typescript/bin/tsc");
  run(process.execPath, [typescriptBin, "--project", typeConfigPath], consumerDirectory);

  console.log(`Verified ${manifest.name}@${manifest.version}: tarball contents, ESM, CommonJS, React, and declarations.`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
