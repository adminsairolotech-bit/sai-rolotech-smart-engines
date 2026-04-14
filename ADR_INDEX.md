# Architecture Decision Records (ADR) Index

> **Safety-Critical Governance Notice**
>
> This repository controls roll-forming workflows that can impact CNC output and operator safety. ADR discipline is therefore **mandatory**, not optional.

## Purpose

This document is the central index for all Architecture Decision Records (ADRs) in **sai-rolotech-smart-engines**.

It exists to:
- Make architectural decisions discoverable.
- Preserve decision context and trade-offs.
- Enforce traceability for safety-relevant changes.
- Reduce regressions in geometry, export, and CNC safety pathways.

---

## Usage Rules

1. **Create an ADR before implementing any significant architectural change.**
2. **One decision per ADR.** If scope expands, create additional ADRs.
3. **Never delete ADRs.** Mark them as `Deprecated` or `Superseded` instead.
4. **Link code/PRs/issues** in the ADR body to maintain auditability.
5. **Update this index in the same PR** that adds or changes an ADR.
6. **Status transitions must be explicit** (for example: Proposed → Accepted).

---

## ADR Storage Location

All ADR documents must be stored in:

`/docs/adr/`

If the directory does not exist, create it in the same change set as the first ADR.

---

## Naming Convention

ADR files must follow this pattern:

`ADR-XXX-title.md`

Where:
- `XXX` is a zero-padded numeric identifier (e.g., `001`, `027`, `143`).
- `title` is lowercase kebab-case and concise.

Examples:
- `ADR-001-adopt-station-validation-matrix.md`
- `ADR-014-cnc-safety-score-threshold-policy.md`

---

## Status Legend

- **Proposed** — Drafted and under review; not yet approved for mandatory use.
- **Accepted** — Approved and active; must be followed.
- **Rejected** — Considered but not adopted.
- **Deprecated** — Previously used; no longer recommended for new work.
- **Superseded** — Replaced by a newer ADR (reference replacement ADR).

---

## Enforcement Rule (Safety-Critical)

An ADR is **required** for any pull request that changes logic, contracts, validation, or data flow related to:

1. **Geometry** (DXF import, normalization, profile interpretation, centerline/inner/outer behavior)
2. **Export** (ZIP/CSV/XML/DXF packaging, readiness checks, preflight rules)
3. **CNC Safety** (G-code generation, safety validators, scoring thresholds, blocking policies)

### Merge Gate Requirement

PRs touching any of the above areas **must not be merged** unless all conditions are met:
- A new ADR is added (or an existing ADR is formally updated).
- This index includes/updates the corresponding ADR row.
- ADR status is set to `Proposed` or `Accepted`.
- Safety impact and rollback strategy are documented in the ADR.

---

## ADR Registry

| ID | Title | Status | Date | Tags | Link |
|---|---|---|---|---|---|
| ADR-001 | Station readiness classification matrix | Accepted | 2026-03-20 | tooling, validation, safety | [ADR-001](./docs/adr/ADR-001-station-readiness-classification-matrix.md) |
| ADR-002 | Export preflight blocking for incomplete stations | Accepted | 2026-03-22 | export, governance, safety | [ADR-002](./docs/adr/ADR-002-export-preflight-blocking-incomplete-stations.md) |
| ADR-003 | CNC safety validator threshold and release gate | Proposed | 2026-04-09 | cnc, gcode, risk-control | [ADR-003](./docs/adr/ADR-003-cnc-safety-validator-threshold-release-gate.md) |

> **Note:** Entries above are example ADR records and should be replaced/expanded with the repository's actual ADR set as records are authored.

---

## Update Checklist (for contributors)

- [ ] ADR file created/updated under `/docs/adr/`
- [ ] Filename follows `ADR-XXX-title.md`
- [ ] ADR status clearly declared
- [ ] Safety impact documented
- [ ] Index table updated in `ADR_INDEX.md`
- [ ] PR references ADR ID in title or description
