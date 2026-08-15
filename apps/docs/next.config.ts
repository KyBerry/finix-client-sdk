import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark" },
  keepBackground: false,
  defaultLang: "ts",
};

// GitHub Pages serves the site from /<repo>/, so the static export needs a
// base path. Local dev and Vercel-style hosts leave NEXT_PUBLIC_BASE_PATH unset.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

// Plugins are referenced by name so the options stay serializable for Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug", ["rehype-pretty-code", prettyCodeOptions]],
  },
});

export default withMDX(nextConfig);
