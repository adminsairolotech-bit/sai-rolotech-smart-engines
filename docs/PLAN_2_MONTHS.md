# SAI ROLO TECH — Honest 2-Month Sprint Plan

> **Principle:** small vertical slices, each with DoD + tests + evidence.
> **Rulebook:** `HERMES_RULES_V3.md` (binding).
> **Cadence:** 1 slice = 2–4 working days. Each ships with proof.
> **Start:** 2026-04-24

---

## What "Real" Means Here

**Ek slice "DONE" sirf tab hai jab:**
- DoD file `docs/dod/SLICE-XXX-*.md` checked off
- `pytest` green (unit + adversarial)
- Coverage ≥ 90% for new code
- Real sample input in `attached_assets/` or `testdata/`
- Deprecation path for any replaced legacy code
- Output artefact shown in chat with command + output

Koi "ho gaya" nahi. Sirf command + output + hash.

---

## Month 1 — Foundations (Weeks 1–4)

### WEEK 1 — Geometry & CAD Input Pipeline

| Slice | Name | Files touched | Acceptance |
|---|---|---|---|
| ✅ SLICE-001 | Real DXF parser (ezdxf) | `src/hermes/dxf.py`, tests | **DONE 2026-04-24, 26 tests, 100% coverage** |
| SLICE-002 | Structured logging + pyproject.toml strict | `pyproject.toml`, `src/hermes/log.py` | `mypy --strict` clean |
| SLICE-003 | Pre-push git gate | `.husky/pre-push`, `scripts/gate.ps1` | `git push` blocks on red tests |
| SLICE-004 | DXF entity healer (overlap merge) | `src/hermes/heal.py` | 10 real files healed, reported |

### WEEK 2 — Profile Classification

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-005 | Profile typing (C / Z / U / Σ / custom) | 20 real DXF correctly classified |
| SLICE-006 | Tolerance + units enforcement | `width_mm`, `angle_deg`, no bare floats |
| SLICE-007 | Reference profile library (`testdata/profiles/`) | 15 golden DXFs committed |

### WEEK 3 — Bend & K-Factor Math

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-008 | Bend allowance calculator | ASM Handbook cited, 5 test cases |
| SLICE-009 | K-factor by material (GI, SS, Al) | Sourced constants, unit tests |
| SLICE-010 | Springback estimator | Matches 3 published benchmarks ±5% |

### WEEK 4 — Station Planning

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-011 | Flower pattern generator (bend sequence) | For C-80 GI 2mm: 12 stations, deterministic |
| SLICE-012 | Per-station roller geometry | JSON schema validated, golden file |
| SLICE-013 | Station-by-station physics sim | Replaces `physics_sim_engine.py` with real calc |

---

## Month 2 — Output & Integration (Weeks 5–8)

### WEEK 5 — G-Code

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-014 | G-code skeleton generator | Runs through Fanuc + Siemens validators |
| SLICE-015 | Real G-code safety validator | Replaces `gcode_safety_validator.py`, 20 hostile samples |
| SLICE-016 | Dry-run simulator link | Output plays through `physics_sim_engine.py` |

### WEEK 6 — BOM, Process Card, CAD Export

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-017 | Real BOM generator | Pulls from roller geometry + bearing catalog |
| SLICE-018 | Process card (operator-facing) | PDF output, signed-off by 1 domain expert |
| SLICE-019 | STEP/DXF export of rollers | Round-trips through FreeCAD/SolidWorks |

### WEEK 7 — Orchestration & Telemetry

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-020 | New `master_orchestrator` using slices 1–19 | End-to-end real DXF → real G-code |
| SLICE-021 | PLC bridge Modbus real I/O | Reads from 1 real or simulated PLC endpoint |
| SLICE-022 | Live telemetry JSON spec + writer | `machine_telemetry.json` validated schema |

### WEEK 8 — Hardening & Release

| Slice | Name | Acceptance |
|---|---|---|
| SLICE-023 | CI/CD on GitHub Actions | Full pytest + coverage + benchmark on every PR |
| SLICE-024 | Reality Ratio dashboard automation | Auto-update daily from git + CI |
| SLICE-025 | Release candidate v0.1.0 | Tag, changelog, rollback guide |
| SLICE-026 | Domain-expert sign-off demo | 1 operator runs full flow end-to-end on real profile |

---

## Daily / Weekly Rituals

- **Daily:** update `MASTER_CONTROL_DASHBOARD_DAILY.md` with claims vs proofs.
- **Weekly Friday:** Reality Ratio review. If <0.80 two weeks running → freeze new slices, fix proofs.
- **Biweekly:** mutation test on critical modules (`mutmut`).

---

## Definition of "Project Success" on 2026-06-19

1. 26 slices shipped, each with DoD + proof.
2. `pytest tests/` green with ≥ 85% global coverage.
3. End-to-end flow: real DXF → classified profile → bend plan → G-code → validator pass → operator card.
4. Reality Ratio ≥ 0.85 average over last 14 days.
5. One real operator / domain expert has run the flow and signed acceptance.

---

## Non-Goals (Explicit)

- ❌ Clone of AutoCAD / SolidCAM GUI.
- ❌ 3D CAD modelling.
- ❌ Cloud SaaS deployment.
- ❌ Multi-tenant user management.
- ❌ AI "auto-generates" any safety-critical output without review.

These are years of work. We are NOT pretending to build them in 2 months.

---

## What We Are Willing To Delay If Slipping

Priority **cut-line** from bottom up:
1. SLICE-019 (CAD export) → nice-to-have.
2. SLICE-021 (PLC live I/O) → simulator stays.
3. SLICE-018 (PDF styling) → markdown is fine.

Priority **must-ship** (never cut):
- SLICE-001, 002, 003 (foundations + gates)
- SLICE-008, 009 (real bend math)
- SLICE-014, 015 (G-code + safety)
- SLICE-020 (orchestrator)
- SLICE-023 (CI)

---

*Plan signed: Hermes / Station-1, 2026-04-24.*
*First slice already complete with proof.*
