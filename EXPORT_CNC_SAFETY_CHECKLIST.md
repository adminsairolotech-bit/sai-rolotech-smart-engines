# EXPORT CNC SAFETY CHECKLIST

## Purpose
- [ ] Confirm this checklist is executed **before every export** of machine-ready artifacts (G-code, setup package, station metadata) for the roll forming line.
- [ ] Confirm the export target is clearly identified (project ID, profile name, material, thickness, line speed, machine revision).
- [ ] Confirm this review is treated as **safety-critical**: no pass-by-default behavior, no silent warnings, no skipped checks.
- [ ] Confirm all data used for this review is generated from the current validated project state (not stale cache).

## Geometry Integrity
- [ ] Verify source profile geometry exists and is non-empty.
- [ ] Verify geometry is normalized and free of self-intersections, inverted loops, duplicate segments, and zero-length entities.
- [ ] Verify station sequence is complete and references the same geometry revision.
- [ ] Verify centerline / inner / outer references are internally consistent across all stations.
- [ ] Verify bend radii, segment lengths, and transition continuity are physically realizable for the configured roll set.
- [ ] Verify no station references missing upstream geometry or missing flower pattern data.
- [ ] **HARD FAIL** if any required station is classified as `Blocked` or `No Profile`.

## Bend Validation
- [ ] Verify bend definitions exist for every required station.
- [ ] Verify each bend target angle is finite, bounded, and not NaN/Infinity.
- [ ] Verify springback compensation is explicitly applied (`overbend = targetAngle × springbackFactor`) and stored per bend.
- [ ] Verify bend order is deterministic and consistent with station progression.
- [ ] Verify bend angle transitions between adjacent stations do not exceed machine/process limits.
- [ ] Verify material-dependent bend constraints are satisfied (radius/thickness/process constraints).
- [ ] **HARD FAIL** if any required bend is missing, undefined, or outside safe machine limits.

## Z-Axis Safety
- [ ] Verify all Z moves are explicit and bounded by machine travel limits.
- [ ] Verify safe clearance height is defined and respected between non-cutting / transition moves.
- [ ] Verify no commanded Z position causes tool, roll, fixture, or workpiece collision.
- [ ] Verify retract-before-rapid policy is enforced where required by the machine kinematics.
- [ ] Verify no negative/unsafe plunge depth appears outside approved operation contexts.
- [ ] **HARD FAIL** if any Z command exceeds soft/hard travel limits or violates clearance constraints.

## Toolpath Safety
- [ ] Verify all toolpaths are continuous or intentionally segmented with safe transitions.
- [ ] Verify no rapid traverse intersects tooling, guards, mandrels, or material envelope.
- [ ] Verify feed rates and line speed commands are within machine and material safe envelopes.
- [ ] Verify tool direction, station orientation, and coordinate frames are consistent (no axis inversion).
- [ ] Verify entry/exit moves are collision-safe and do not induce tool shock.
- [ ] Verify all path points are finite numeric values with no NaN/Infinity.
- [ ] Verify machine limits are enforced on X/Y/Z and rotational axes (if present).
- [ ] **HARD FAIL** if any path segment implies collision risk, frame mismatch, or out-of-bounds motion.

## G-code Validation
- [ ] Verify generated G-code is non-empty and mapped to every required complete station.
- [ ] Verify G-code parser/linter succeeds with zero syntax errors.
- [ ] Verify unsupported or controller-forbidden commands are absent.
- [ ] Verify modal state transitions are explicit and safe (units, plane, absolute/incremental, feed mode).
- [ ] Verify spindle/tool/auxiliary commands are present and ordered correctly for machine policy.
- [ ] Verify program start/end blocks, safety lines, and reset behavior are valid.
- [ ] Verify CNC safety validator score is recorded.
- [ ] **HARD FAIL** if CNC safety validator score is **< 70**.
- [ ] **HARD FAIL** if any required station lacks valid G-code output.

## Simulation Check
- [ ] Run full-path simulation (all required stations) against the current machine model.
- [ ] Verify no collisions, overtravel, gouging, or fixture interference events are reported.
- [ ] Verify cycle timing and kinematic transitions remain within safe dynamic limits.
- [ ] Verify simulation uses the same post-processed G-code intended for export.
- [ ] **HARD FAIL** if any unresolved simulation error or collision warning remains.

## Determinism Check
- [ ] Re-run export from identical inputs and verify byte-stable (or hash-stable) output for safety-critical files.
- [ ] Verify station ordering, tool numbering, and operation sequencing are deterministic.
- [ ] Verify no nondeterministic timestamps/IDs alter machine-interpreted content.
- [ ] Verify repeated validation produces identical pass/fail outcomes.
- [ ] **HARD FAIL** if deterministic replay cannot reproduce equivalent safety-critical output.

## Hard Fail Conditions
- [ ] Any required station is `Blocked`, `No Profile`, or `Incomplete` at export time.
- [ ] Missing machine data, missing BOM-required machine context, or missing material constraints.
- [ ] Any null/undefined critical field used in toolpath, bend, or G-code generation.
- [ ] Any geometry integrity error that can propagate to toolpath generation.
- [ ] Any bend target or compensation value outside configured safe limits.
- [ ] Any axis command exceeds machine limits.
- [ ] Any collision risk flagged in toolpath analysis or simulation.
- [ ] G-code validator/parsing failure, forbidden opcode, or malformed program structure.
- [ ] CNC safety validator score < 70.
- [ ] Any unresolved critical warning related to titanium or stainless safety constraints.
- [ ] Any disabled preflight gate bypassed manually.

## Final Verdict
- [ ] **PASS — EXPORT PERMITTED** only if **every checklist item above is checked** and **no hard fail condition is present**.
- [ ] **FAIL — EXPORT BLOCKED** if any single required item is unchecked or any hard fail condition is true.
- [ ] Confirm outcome is surfaced to operators with explicit blocking reasons and affected station numbers.
- [ ] Confirm no success message is shown for partial, synthesized, blocked, or empty export outputs.

## Auditor
- Auditor Name:
- Role/Team:
- Date (UTC):
- Project / Part ID:
- Machine ID / Controller:
- Material / Thickness:
- Build/Commit Reference:
- CNC Safety Score:
- Simulation Run Reference:
- Verdict (PASS/FAIL):
- Notes / Required Corrective Actions:
