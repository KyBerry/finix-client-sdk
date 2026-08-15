# Documentation site for `@kyberry/finix-client-sdk`

Date: 2026-08-14
Status: approved design, ready for an implementation plan

## Goal

A documentation site with guides, a hand-written API reference, and live
hosted-form examples for the SDK. Built as a new workspace app on Next 15,
Tailwind v4, shadcn/ui with the React Aria base, and Phosphor icons. The
existing playground app is untouched; the docs link to it.

## Non-goals

- Search, versioned docs, i18n.
- Auto-generated API docs from TypeScript. The reference is hand-written so
  it reads well and matches the site design.
- Deployment configuration.
- Any change to `apps/playground` or `packages/ui`.

## Decisions

| Topic | Decision | Why |
| --- | --- | --- |
| Placement | New app `apps/docs`, package `@kyberry/finix-client-sdk-docs`, dev port 3001 | Keeps the approved playground intact; avoids the port the playground uses |
| Styling | Tailwind v4 (`@tailwindcss/postcss`), self-contained | shadcn's current CLI and the React Aria base target v4; `packages/ui` is v3 and holds one button, so sharing it would mean mixing Tailwind majors in one app |
| Components | `shadcn init --base aria`, Vega style, neutral base color, CSS variables | React Aria Components as the primitive layer, with source owned by the repo |
| Icons | `@phosphor-icons/react`, regular weight, 16px, functional use only | Requested; matches the restrained direction |
| Authoring | MDX via `@next/mdx`, file-based routes `app/docs/**/page.mdx` | Prose stays prose; each page owns its `metadata` export |
| Code highlighting | `rehype-pretty-code` (shiki), server-rendered | No client highlight bundle |
| Navigation | One typed list in `lib/navigation.ts` | Explicit ordering; a test verifies every href has a page |
| Live examples | Client example components under `components/examples/`; a server `LiveExample` component reads and highlights the example's own source file | The Code tab is always the file that runs, so snippets cannot drift |
| Theme | Light and dark, `prefers-color-scheme` default, persisted toggle via `next-themes` | Site must read well in both |
| Design | Quiet technical reference | Kyle's recorded taste: tool, not a page; mono for literals only; no editorial gestures |

## Architecture

```
apps/docs/
  app/
    layout.tsx               root: fonts, theme provider, top bar
    page.tsx                 landing
    docs/
      layout.tsx             sidebar + article + TOC shell
      getting-started/{installation,quick-start,tokenization-flow}/page.mdx
      guides/{appearance,react,errors-timeouts-abort,auth}/page.mdx
      reference/{client,payment-form,loader,appearance,react,auth,errors,types}/page.mdx
      examples/{basic-card,themed-appearance,react-headless}/page.mdx
  components/
    ui/                      shadcn (aria base) generated components
    site/                    TopBar, Sidebar, MobileNav, Toc, ThemeToggle, VersionBadge
    mdx/                     Callout, CodeBlock, Steps, PropsTable, Tabs wrappers, mdx-components map
    examples/                basic-card.tsx, themed-appearance.tsx, react-headless.tsx
    live-example.tsx         server component: loads source, highlights, renders demo + code tabs
  lib/
    navigation.ts            typed nav tree
    source.ts                readExampleSource(id), highlight(code, lang)
    utils.ts                 cn()
  content/                   none — pages live in app/docs; prose is in the .mdx files
  mdx-components.tsx         Next's MDX component provider
  next.config.ts             @next/mdx with remark-gfm, rehype-slug, rehype-pretty-code
  postcss.config.mjs
  app/globals.css            Tailwind v4 import, shadcn tokens, prose-doc utilities
  vitest.config.mts
  __tests__/                 navigation.test.ts, source.test.ts, props-table.test.tsx
```

Dependencies: `next` (same version as playground), `react`/`react-dom` 19,
`@kyberry/finix-client-sdk` `workspace:*`, `react-aria-components`,
`@phosphor-icons/react`, `next-themes`, `@next/mdx`, `@mdx-js/loader`,
`@mdx-js/react`, `remark-gfm`, `rehype-slug`, `rehype-pretty-code`, `shiki`,
`tailwindcss` v4, `@tailwindcss/postcss`, `class-variance-authority`, `clsx`,
`tailwind-merge`. Dev: `vitest`, `@testing-library/react`, `jsdom`, `typescript`.

## Layout and visual design

- Top bar, 56px, hairline bottom border. Left: wordmark `@kyberry/finix-client-sdk`
  in the UI sans at medium weight, followed by a version badge that reads the
  SDK `package.json` version at build time. Right: text links Playground, GitHub,
  npm (external-link glyph 14px), and a theme toggle (Phosphor `Sun`/`Moon`).
- Left sidebar, 240px, sticky under the top bar, scrolls independently. Four
  sections with plain labels: Getting started, Guides, Reference, Examples.
  Items are 14px; the current item has a 2px left rule in the accent and
  medium weight. No pills, no icons on nav items. Under `lg` the sidebar
  becomes a shadcn `Sheet` opened by a Phosphor `List` button in the top bar.
- Article column, max 68ch, 16px/1.7 body. Headings in the same sans, weight
  600, tight tracking, sizes 30/22/18. Links in the accent with underline on
  hover. Inline code in mono at 0.9em on a subtle surface. Tables have hairline
  rows only.
- Right TOC on `xl`, 200px, 13px, h2 and h3, active heading tracked with an
  IntersectionObserver.
- Landing page: one sentence of what the package is, an install command block,
  and a two-tab code block (Browser / React) with the quick-start snippet, then
  three plain text links (Getting started, Reference, Examples). No hero
  artwork, no gradient, no feature grid.
- Color: shadcn neutral tokens; one accent (a restrained blue, defined once as
  `--accent-link`) for links, focus rings, and the current-nav rule. Dark mode
  raises surface contrast slightly; borders stay hairlines.
- Typography: system sans stack for prose and UI; a mono stack for code and
  literal values only.
- Icons: Phosphor regular weight, 16px, only where they carry meaning:
  callout glyphs, copy, external link, theme toggle, mobile nav trigger,
  Steps numerals are text, not icons.
- Prohibited: comment-style headers, mono uppercase eyebrows or badges,
  numbered "01" indexing, gradients, decorative icon rows, card grids for
  prose.

## MDX component vocabulary

- `Callout` — `variant: "note" | "warning"`, Phosphor `Info` or `Warning`
  glyph, hairline left rule, no fill in light mode, faint fill in dark.
- `CodeBlock` — applied automatically to fenced code through
  `rehype-pretty-code`; optional `title` meta renders a filename tab; a copy
  button (Phosphor `Copy`, becomes `Check` for 1.5s) sits top-right.
- `Tabs` — shadcn aria Tabs, used for Browser/React variants of a snippet.
- `Steps` / `Step` — ordered list with a text numeral column.
- `PropsTable` — `rows: { name, type, default?, description }[]`; name and
  type in mono, description prose. Used across reference pages.
- `LiveExample` — see below.

## Live examples

- Each example is a client component in `components/examples/<id>.tsx`. It
  reads `process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID` and mounts the hosted
  form using the SDK's React entry (`FinixForm.Root` / `FinixForm.Host` and
  `useFinixPaymentForm`, or `FinixPaymentForm` for the basic case).
- `LiveExample` is a server component: `readExampleSource(id)` reads the file
  from disk at build time, `highlight()` renders it with shiki, and the
  component renders shadcn Tabs: **Preview** (the client demo) and **Code**
  (the highlighted source). The Code tab is therefore always the file that runs.
- Every example shows a telemetry strip beneath the form: `status`,
  `hasErrors`, and the token id after a successful submit. Values in mono.
- If the application id is unset, the Preview tab shows a short notice naming
  the variable instead of mounting; nothing throws. SDK errors surface in the
  strip with their `code`.
- Launch examples: `basic-card` (standalone `FinixPaymentForm`, card only),
  `themed-appearance` (`defineFinixHostedAppearance` with a small custom
  theme), `react-headless` (`FinixForm.Root/Host` with a custom submit button
  gated on `hasErrors`).

## Content at launch

Adapted from the README and source, one page each:

- Getting started: Installation · Quick start (Browser/React tabs) ·
  Tokenization flow (token → server-side Payment Instrument claim)
- Guides: Appearance & theming · React primitives · Errors, timeouts & abort ·
  Auth sessions
- Reference: `FinixClient` · `PaymentFormInstance` · `loadFinix` &
  `FINIX_SCRIPT_URL` · Appearance helpers (`defineFinixHostedAppearance`,
  `defineFinixHostedAppearanceAdapter`, `defineFinixPaymentFormOptions`,
  `defineFinixStyles`, `mergeFinixStyles`) · React (`FinixForm.*`,
  `FinixPaymentForm`, `useFinixPaymentForm`) · `createFinixAuth` /
  `FinixAuthSession` · Error codes (`FINIX_SDK_ERROR_CODES` table) · Types &
  constants (`FINIX_*` constants and exported types)
- Examples: the three live examples

Each page carries `export const metadata = { title, description }`.

## Testing and verification

- Vitest (jsdom): `navigation.test.ts` asserts every nav href resolves to an
  existing `page.mdx`; `source.test.ts` asserts `readExampleSource` returns
  each launch example and rejects unknown ids; `props-table.test.tsx` renders
  rows.
- `pnpm --filter @kyberry/finix-client-sdk-docs check-types` and `next build`
  pass in turbo.
- Rendered verification in a real browser before completion: light and dark,
  desktop and mobile widths, sidebar Sheet opens, TOC tracks, at least one live
  example mounts against sandbox and reports `status: ready`.

## Error handling

- Unknown `LiveExample` id fails the build (thrown in the server component).
- Missing application id degrades to a notice in the Preview tab.
- Broken nav entries fail the unit test, not the user.
