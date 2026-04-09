# Auto Audit Bot Workflow

## What this workflow does

The `auto-audit-bot.yml` workflow enforces CI safety checks for roll-forming and CNC-related code changes.

It runs on:
- Pull requests targeting `main`
- Pushes to `main`
- Pushes to `release/*` branches

The workflow executes:
1. Dependency install with locked versions (`npm ci`)
2. Linting (`npm run lint`)
3. Type checking (`npm run typecheck`)
4. Unit testing (`npm test -- --runInBand`)
5. Optional geometry contract tests (`npm run test:geometry --if-present`)
6. Optional export tests (`npm run test:export --if-present`)
7. Optional deterministic export checks (`npm run test:deterministic --if-present`)
8. Optional G-code validator (`npm run validate:gcode --if-present`)
9. Audit report upload from `reports/audit/` when present

## How to add new audit checks

1. Add a new npm script in `package.json` (for example: `"test:new-audit": "..."`).
2. Add a new step in `.github/workflows/auto-audit-bot.yml` after related checks.
3. Keep the step blocking (`continue-on-error: false`) for safety-critical checks.
4. Add comments that describe the roll-forming or CNC safety rationale.
5. If the check is optional, use `--if-present` in the command.

## What causes CI to fail

CI fails when any required step exits with a non-zero status, including:
- Dependency installation failure
- Lint/typecheck/test failures
- Safety validator failures
- Missing artifacts when upload is attempted

Optional checks using `--if-present` are skipped if the script is undefined, but fail if defined and the command fails.

## How to run checks locally

From repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:geometry --if-present
npm run test:export --if-present
npm run test:deterministic --if-present
npm run validate:gcode --if-present
```

If your local scripts generate audit evidence, confirm output exists under:

```bash
reports/audit/
```
