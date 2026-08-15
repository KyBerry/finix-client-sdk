# Releasing `@kyberry/finix-client-sdk`

After the package has been bootstrapped on npm, publishing is performed only by manually dispatching `.github/workflows/publish.yml` for an existing release tag. The workflow uses npm trusted publishing (OIDC), so routine releases do not use or store a long-lived npm token.

## First publication only

npm requires a package to exist before a trusted publisher can be configured. Check first with `npm view @kyberry/finix-client-sdk version`. If the package does not exist, the first publication is an explicit maintainer operation:

1. Confirm control of the `@kyberry` npm scope, enable account-level 2FA, and authenticate with `npm login`.
2. Run `pnpm install --frozen-lockfile` and `pnpm release:check` from a clean checkout of the reviewed launch commit.
3. From `packages/sdk`, run `NPM_CONFIG_PROVENANCE=false npm publish --access public`. The override is necessary because local publication cannot create the GitHub Actions provenance attestation requested by `publishConfig`.
4. Immediately configure trusted publishing as described below. Do not retain or add an npm token to this repository.
5. Tag that exact commit and create the corresponding GitHub Release. Do not dispatch the publish workflow for the already-published bootstrap version.

This one-time operation changes public registry state and requires the maintainer's confirmation. It is not performed as part of local preparation.

## One-time npm configuration

1. Confirm that `@kyberry/finix-client-sdk` is owned by the intended npm organization or account and that this GitHub repository is public.
2. In the package settings on npm, add a GitHub Actions trusted publisher for repository `KyBerry/finix-client-sdk`, workflow file `publish.yml`, environment `npm`, and allowed action `npm publish`.
3. In the GitHub repository, create the `npm` environment. Add required reviewers if publication should require an operator approval.
4. Protect `main` and require the `CI` workflow before merge.

npm trusted publishing requires Node.js 22.14 or newer and npm CLI 11.5.1 or newer. The publish workflow uses Node.js 24, requests only `contents: read` and `id-token: write`, and publishes a provenance attestation.

## Prepare a release

1. Update `packages/sdk/package.json` to the intended semantic version and update `CHANGELOG.md` in a pull request.
2. Run `pnpm install --frozen-lockfile` and `pnpm release:check` from the repository root.
3. Install Chromium once with `pnpm --filter @kyberry/finix-client-sdk exec playwright install chromium`, then run the live sandbox contract check with `FINIX_SANDBOX_APPLICATION_ID=... pnpm --filter @kyberry/finix-client-sdk test:live`. This test must not enter real payment data or submit a token.
4. Review the live canary separately from the deterministic release gate. A failure can represent wrapper drift, vendor drift, sandbox configuration, or network availability and must be diagnosed rather than bypassed.
5. Merge only after CI is green. Do not publish from a dirty local checkout.
6. Create and push a tag on the exact merged commit. The tag must exactly match `v<package version>` (for example, package `0.1.0` uses tag `v0.1.0`).
7. In GitHub Actions, manually run `Publish package` with that tag. The protected `npm` environment provides the operator approval. The workflow checks the tag and its ancestry from `main`, reruns the release gate, rejects versions already present on npm, and then publishes.
8. After publication succeeds, create the GitHub Release for the same tag.

After the workflow finishes, verify the npm package page shows the expected version and provenance, then install that exact version in a separate application and run one browser smoke against the Finix sandbox. A green publish workflow proves the artifact and registry publication; it does not prove a live payment flow.

For ongoing drift detection, configure the repository variable `FINIX_SANDBOX_APPLICATION_ID`. `.github/workflows/finix-live-canary.yml` then runs the non-submitting CDN canary on its schedule and on manual dispatch. Keep it outside `release:check`; it is an external availability signal, not a deterministic package test.
