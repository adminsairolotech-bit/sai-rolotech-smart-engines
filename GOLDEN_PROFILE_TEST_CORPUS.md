# GOLDEN PROFILE TEST CORPUS

**Version:** 1.0.0
**Owner:** Sai Rolotech Smart Engines QA + Safety Engineering
**Status:** Production Baseline (Release-Blocking)
**Last Updated:** 2026-04-09

## Purpose

This document defines the **golden test corpus specification** for validating the Sai Rolotech roll forming software stack across deterministic geometry processing, tooling generation, export integrity, and CNC safety controls. The corpus defines minimum mandatory test cases, expected outcomes, and release-gating behavior for local development and CI.

---

## 1) Objective

The golden corpus exists to ensure that safety-critical roll forming outputs are:

- **Deterministic** (same input always produces equivalent validated output)
- **Correct** (geometry, bend order, and conversions are mathematically consistent)
- **Safe** (no CNC-ready claim without passing G-code safety validation)
- **Regression resistant** (changes cannot silently break known-good manufacturing behavior)

For this system, corpus failure is treated as a **release blocker** because invalid profile computation or unsafe export can propagate to tooling decisions and downstream CNC operations.

---

## 2) Scope

This corpus applies to the following Sai Rolotech modules and audit buckets:

| Module Area | Included | Related Audit Bucket(s) |
|---|---:|---|
| DXF import and normalization | ✅ | 1. DXF import and geometry normalization |
| Centerline / inner / outer conversion | ✅ | 2. Centerline / inner / outer conversion |
| Flower pattern preconditions | ✅ (readiness + dependency validation) | 3. Flower pattern engine |
| Roll tooling generation inputs/outputs | ✅ | 4. Roll tooling engine |
| Export engine (ZIP/CSV/XML/DXF) | ✅ | 5. Export engine |
| Simulation package compatibility checks | ✅ (export contract-level) | 6. Simulation / Digital Twin / Package views |
| G-code safety and CNC readiness | ✅ | 7. G-code / CNC safety |
| Auth/persistence | ❌ (out of scope for this corpus) | 8. Auth / backend / persistence |

---

## 3) Golden Corpus Design Principles

1. **Determinism First**
   - Identical inputs must produce stable ordering and equivalent output hashes (or canonicalized semantic equivalence) across repeated runs.
2. **Coverage of Critical Paths**
   - Corpus must include nominal, edge, malformed-but-recoverable, and invalid-reject scenarios.
3. **Safety-Focused Validation**
   - No case is marked CNC-ready unless the G-code safety validator score is **≥ 70** and no critical safety flags remain.
4. **Null/Partial Data Resilience**
   - Pipelines must fail with explicit actionable error states; no silent fallthrough.
5. **Export Contract Integrity**
   - Export artifacts must be present, parseable, and internally consistent with computed station/tooling state.

---

## 4) Test Case Structure Definition

Each corpus case MUST define the following fields.

| Field | Required | Description |
|---|---:|---|
| `case_id` | ✅ | Stable immutable identifier, e.g., `GTC-001` |
| `description` | ✅ | Human-readable intent and risk focus |
| `input_spec` | ✅ | File path (`fixtures/*.dxf|json`) or inline profile spec |
| `profile_type` | ✅ | e.g., U-channel, Z-profile, C-channel, custom |
| `units` | ✅ | `mm` or `inch` (with expected conversion behavior) |
| `expected_bend_sequence` | ✅ | Ordered list with sign + side semantics (e.g., `L+90,R+90,L+90`) |
| `expected_segment_count` | ✅ | Expected normalized segment count |
| `expected_geometry_mode` | ✅ | `centerline`, `inner`, `outer`, or converted target |
| `expected_export_characteristics` | ✅ | Required artifact set + schema/field assertions |
| `cnc_safety_expectations` | ✅ | Expected safety score range + blocker/non-blocker flags |
| `pass_fail_criteria` | ✅ | Binary release gate conditions; include explicit fail triggers |

### Canonical YAML Skeleton

```yaml
case_id: GTC-000
summary: "Short intent"
input_spec:
  type: file
  path: fixtures/profiles/example.dxf
profile_type: U-channel
units: mm
expected_bend_sequence: ["L+90", "R+90", "L+90"]
expected_segment_count: 7
expected_geometry_mode: centerline
expected_export_characteristics:
  required_files: ["profile.json", "tooling.csv", "gcode.nc", "package.zip"]
  schema_checks:
    - "profile.json contains rollProfile + bendAngles"
cnc_safety_expectations:
  min_score: 70
  disallow_flags: ["collision_risk", "travel_out_of_bounds"]
pass_fail_criteria:
  must_pass_all_assertions: true
  release_blocker_on_failure: true
```

---

## 5) Minimum Required Test Cases (Baseline Set)

> **Requirement:** At least these 10 cases must exist and pass in every release candidate.

| Case ID | Name | Profile Type | Key Input Spec | Expected Behavior |
|---|---|---|---|---|
| GTC-001 | Symmetric U-channel 3-bend | U-channel | Web=100 mm, Flange L/R=50 mm, t=2 mm, bends=[90,90,90], seq L-R-L | Produces stable 3-bend sequence `L+90,R+90,L+90`, valid stations, exportable package, CNC safety pass |
| GTC-002 | Asymmetric flange profile | C-channel (asymmetric) | Web=120 mm, Flange L=40 mm, R=65 mm, t=2.5 mm | Unequal flange geometry preserved; no forced symmetry; tooling + export consistent |
| GTC-003 | Mirrored profile parity | Z-profile mirror pair | Source profile and X-mirror variant | Mirrored case flips orientation but preserves bend magnitudes and manufacturability constraints |
| GTC-004 | Malformed DXF recovery | U-channel from malformed DXF | DXF with duplicate/overlapping segments + minor gaps | Normalization repairs topology and produces valid normalized profile with warnings (not silent) |
| GTC-005 | Invalid geometry rejection | Invalid custom | Self-intersecting polyline / impossible bend chain | Hard reject with explicit validation errors; no tooling/export generation |
| GTC-006 | Centerline→outer conversion signs | C-channel | Centerline input + positive/negative bends | Outer conversion preserves bend sign semantics and pass ordering |
| GTC-007 | Centerline→inner conversion signs | Z-profile | Centerline input with alternating bends | Inner conversion preserves sign/orientation and expected neutral-axis assumptions |
| GTC-008 | Deterministic ordering stability | U-channel deterministic replay | Same fixture executed N=10 times | Canonical output ordering/hash stable across all runs |
| GTC-009 | Unit conversion inch→mm | U-channel imperial | Input in inches (e.g., web 4.0 in, flange 2.0 in) | Converted metric dimensions exact within tolerance; downstream sequence unchanged |
| GTC-010 | Export round-trip validity | C-channel package | Generate export ZIP then re-validate manifest/artifacts | Re-import or validator confirms schema + consistency + required files |

### Realistic Inline Profile Specs (Reference)

#### U-Channel (Nominal)

```yaml
name: u_channel_nominal
profile_type: U-channel
units: mm
thickness: 2.0
segments:
  - {type: line, length: 50}   # left flange
  - {type: bend, angle: 90, radius: 3, direction: L}
  - {type: line, length: 100}  # web
  - {type: bend, angle: 90, radius: 3, direction: R}
  - {type: line, length: 50}   # right flange
  - {type: bend, angle: 90, radius: 3, direction: L}
```

#### Z-Profile (Mirroring/Sign Test)

```yaml
name: z_profile_sign_test
profile_type: Z-profile
units: mm
thickness: 1.6
bends:
  - {angle: +45, direction: L}
  - {angle: -45, direction: R}
  - {angle: +90, direction: L}
```

#### C-Channel (Asymmetric)

```yaml
name: c_channel_asymmetric
profile_type: C-channel
units: mm
web: 120
flange_left: 40
flange_right: 65
thickness: 2.5
bends:
  - {angle: 90, direction: L}
  - {angle: 90, direction: R}
```

---

## 6) CNC Safety Test Cases (Mandatory)

At least 3 safety-focused corpus cases must run against the G-code safety validator.

| Safety Case ID | Scenario | Expected Validator Result | Release Gate |
|---|---|---|---|
| GTC-SAF-001 | Safe baseline toolpath within machine bounds | Score **≥ 85**, no critical flags | Pass |
| GTC-SAF-002 | Out-of-bounds axis travel in generated path | Critical flag `travel_out_of_bounds`, score < 70 | Hard Fail |
| GTC-SAF-003 | Potential collision / clamp interference | Critical flag `collision_risk`, score < 70 | Hard Fail |
| GTC-SAF-004 (optional recommended) | Excess feed/spindle mismatch for material limits | Warning/critical depending severity; if critical then score < 70 | Conditional Fail |

**CNC Readiness Rule:** A profile/package may be labeled CNC-ready **only** when safety score is **≥ 70** and no critical flags remain unresolved.

---

## 7) Local Execution (Developer Workflow)

Use `pnpm` only.

```bash
# 1) Install dependencies
pnpm install

# 2) Run corpus test suite (example script names)
pnpm test:golden

# 3) Run deterministic replay mode
pnpm test:golden -- --replay=10

# 4) Run CNC safety-only subset
pnpm test:golden -- --suite=cnc-safety

# 5) Validate export round-trip checks
pnpm test:golden -- --suite=export
```

### Required Local Artifacts

- Machine-readable report: `artifacts/golden/results.json`
- Determinism checksum report: `artifacts/golden/determinism.json`
- Export validation report: `artifacts/golden/export-validation.json`
- CNC safety report: `artifacts/golden/cnc-safety.json`

---

## 8) CI Usage (Release Gating)

CI MUST execute corpus in these stages:

1. **PR Validation:** run full baseline corpus (GTC-001..010 + mandatory safety set).
2. **Main Branch Protection:** block merge if any corpus case fails.
3. **Release Candidate Gate:** require two consecutive clean runs to detect flakiness.
4. **Artifact Retention:** store reports and failed case diffs for audit.

### CI Pass Criteria

- 100% pass on minimum required cases
- Determinism checks stable across replay runs
- No safety case with score < 70 marked pass
- Export round-trip case(s) all green

If any condition fails, pipeline status MUST be **failed** and release promotion blocked.

---

## 9) Adding New Cases

When introducing a new profile family, conversion rule, or safety guard:

1. Create a new immutable `case_id` (`GTC-XXX` / `GTC-SAF-XXX`).
2. Add fixture input (DXF/JSON) and canonical expected output metadata.
3. Define tolerances explicitly (dimensions, angles, ordering, hash/canonical checks).
4. Include failure-mode assertions (what must be rejected/warned).
5. Add case to CI manifest and local suite index.
6. Document rationale and risk class in changelog.

New cases should prioritize:

- previously escaped defects,
- high-severity safety scenarios,
- geometry edge conditions (small radii, thin/thick material, mirrored variants).

---

## 10) Corpus Maintenance Policy

- **Versioned Baseline:** corpus spec and fixture expectations are versioned together.
- **No Silent Re-baselining:** expected output changes require review + justification.
- **Dual Approval Required:** at least one QA approver and one domain/safety approver.
- **Traceability:** every case maps to one or more audit buckets and defect IDs if applicable.
- **Periodic Review:** minimum quarterly review of coverage gaps and manufacturing incident learnings.

---

## 11) Hard Fail Conditions (Regression Blockers)

Any of the following is an automatic release blocker:

1. Any minimum required case fails.
2. Deterministic replay mismatch for identical input.
3. Invalid geometry case accepted when it should be rejected.
4. Malformed-but-recoverable DXF case fails to normalize.
5. Centerline conversion alters bend sign semantics.
6. Unit conversion drift exceeds tolerance.
7. Export round-trip missing required artifact or schema mismatch.
8. Any CNC safety-critical case marked pass with score < 70.
9. Null/partial data causes crash, blank panel, or silent success state.
10. Any corpus runner error that prevents complete case execution.

**Policy Statement:** Golden corpus failure = **Release Blocked** until root cause is fixed and full corpus re-run passes.

---

## 12) Operational Notes for Sai Rolotech

- Corpus outcomes must align with station readiness classification logic (Complete / Incomplete / No Profile / Blocked).
- Export preflight checks must surface exact blocking station numbers and reasons.
- UI and API layers must expose explicit error states for malformed/invalid input and backend-unreachable conditions.
- Safety status in reports must never be optimistic or synthesized; it must reflect actual validator output.

This corpus is the minimum quality and safety contract for production roll forming releases in Sai Rolotech Smart Engines.
