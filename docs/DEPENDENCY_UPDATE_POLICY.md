# Dependency Update Policy (pnpm workspace)

This repo is a pnpm workspace (`pnpm-workspace.yaml`). Dependency updates must be **repeatable**, **reviewable**, and **security-driven**.

## Lockfile rules

- **Always commit `pnpm-lock.yaml`** with any dependency change.
- CI uses `pnpm install --frozen-lockfile` (no implicit lockfile edits in CI).
- Do not run `pnpm install --no-frozen-lockfile` in CI except for explicitly documented packaging workflows.

## Update cadence

- **Security fixes**: apply ASAP (same day if exploitable / auth / upload / export / networking paths).
- **Routine updates**: batch weekly (or per-sprint) to reduce churn.
- Prefer fewer, larger dependency PRs over constant small noise, *except* for urgent security patches.

## How to update (standard)

- Install/update with pnpm at repo root:
  - `pnpm up -r` (workspace-wide)
  - `pnpm -C <package> up` (single package)
- After updating:
  - run package tests/typechecks (at least `artifacts/design-tool` + `artifacts/api-server`)
  - ensure lockfile is updated and committed

## When to use `overrides`

Use `pnpm.overrides` or `pnpm-workspace.yaml` `overrides` only when:

- A transitive dependency has a known vulnerability and upstream fix is not yet merged/released.
- You need to pin a broken transitive version to restore CI/build stability.

Rules:
- Keep overrides **minimal and scoped** (only the impacted package).
- Add a short note in the PR description: **why**, **CVE/advisory link (if any)**, and **removal plan**.
- Remove overrides once upstream fixed versions are available.

## Native/build scripts safety (Windows + CI)

This repo uses `onlyBuiltDependencies` in `pnpm-workspace.yaml`.

- Do not broadly enable arbitrary postinstall scripts.
- If a new native dependency is required, add it intentionally to `onlyBuiltDependencies` and document why.

## What not to do

- Don’t downgrade security-related dependencies to “make it work”.
- Don’t disable `--frozen-lockfile` to “fix CI”.
- Don’t introduce new package managers (no npm/yarn lockfiles) unless explicitly approved.

