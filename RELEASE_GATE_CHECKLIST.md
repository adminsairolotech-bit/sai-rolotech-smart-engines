# RELEASE GATE CHECKLIST — Sai Rolotech Smart Engines

## Release Info
- [ ] Release version/tag defined (e.g., `vX.Y.Z`)
- [ ] Release candidate build ID recorded
- [ ] Target deployment environment identified (staging/production)
- [ ] Release owner assigned
- [ ] Release date/time (UTC) scheduled
- [ ] Scope of included features/fixes documented
- [ ] Out-of-scope items explicitly listed

## Core Validation
- [ ] All required roll-forming pipelines execute without runtime errors
- [ ] Deterministic output verified: identical inputs produce identical station/tooling/G-code results across repeated runs
- [ ] Validation passes for normal, boundary, and null/empty input cases
- [ ] No station is marked complete unless validation data confirms completeness
- [ ] Fallback states verified for loading/error/empty conditions
- [ ] No false-positive success messaging for partial/synthesized/blocked outputs
- [ ] Critical warnings are surfaced to operator in UI and logs

## Geometry Validation
- [ ] Input geometry loaded and normalized successfully
- [ ] Geometry segment integrity validated (no null/undefined segment references)
- [ ] Centerline/inner/outer profile consistency validated
- [ ] Flower pattern prerequisites verified from geometry state
- [ ] Blocked state enforced when upstream geometry or flower data is missing
- [ ] Bend/forming angle arrays validated for presence, shape, and deterministic ordering
- [ ] Station classification matrix applied deterministically (`No Profile`, `Incomplete`, `Complete`, `Blocked`)

## Export Engine Validation
- [ ] Export preflight enforces required data presence (station completeness, machine data, BOM)
- [ ] Export is blocked when any required station lacks roll profile
- [ ] Export is blocked when total complete stations < total stations
- [ ] Export is blocked when machine data or BOM is missing
- [ ] Preflight lists exact blocking station numbers and explicit reasons
- [ ] Generated package artifacts (ZIP/CSV/XML/DXF as applicable) are present and non-empty
- [ ] Export output reproducibility validated for identical input snapshots

## CNC Safety Gate (STRICT BLOCKER)
> **This gate is mandatory and release-blocking. No production release is allowed to proceed unless every item below is checked.**

- [ ] G-code safety validator executed on final generated G-code set
- [ ] Minimum safety score threshold met for all required programs (`>= 70`)
- [ ] No station flagged as CNC-ready when safety score is below threshold
- [ ] Toolpath bounds, collision checks, feed/speed limits, and machine constraints validated
- [ ] Material-specific critical warnings enforced (e.g., Ti slow speed + coolant requirement)
- [ ] Any critical CNC safety violation results in immediate release block
- [ ] Safety report archived with release evidence
- [ ] Reviewer confirms no bypass/override was used on failed safety checks

## Cross-System Consistency
- [ ] React UI, Node API, and Python services agree on station readiness and validation outcomes
- [ ] API responses for roll profile, bend angles, and G-code are schema-consistent across systems
- [ ] Material parameters used in UI warnings match backend validation logic
- [ ] Version compatibility verified between frontend, API, and engine services
- [ ] No data drift between persisted project state and exported artifacts
- [ ] Re-run consistency check confirms deterministic outputs across environments

## Risk Assessment
- [ ] Open defects reviewed and classified by production impact
- [ ] CNC/roll-forming safety risks explicitly reviewed and accepted/rejected
- [ ] Regression risk for geometry, tooling, export, and G-code pathways assessed
- [ ] Rollback strategy documented and tested
- [ ] Monitoring/alerting coverage confirmed for post-release anomalies
- [ ] Residual risks and mitigation owners documented

## Documentation
- [ ] Release notes completed (features, fixes, known issues)
- [ ] Operator-facing CNC safety guidance updated
- [ ] Validation criteria and deterministic behavior guarantees documented
- [ ] Runbooks/playbooks updated for release and rollback
- [ ] Change log includes safety-impacting modifications
- [ ] Evidence links attached (test reports, safety reports, export artifacts)

## Sign-Off

| Area | Required Sign-Off | Name | Date (UTC) | Status (Approved/Blocked) | Notes |
|---|---|---|---|---|---|
| Product/Release Management | Required |  |  |  |  |
| Roll Forming Engineering | Required |  |  |  |  |
| CNC Safety/Manufacturing | **Required (Blocker)** |  |  |  |  |
| QA/Validation | Required |  |  |  |  |
| Software Engineering (Frontend/API/Engine) | Required |  |  |  |  |
| Operations/Deployment | Required |  |  |  |  |

- [ ] All required sign-offs collected and recorded
- [ ] No sign-off marked approved with unresolved blocker items

## Release Block Conditions
- [ ] **BLOCK RELEASE** if any CNC Safety Gate item is unchecked or failed
- [ ] **BLOCK RELEASE** if any required station is `No Profile`, `Incomplete`, or `Blocked`
- [ ] **BLOCK RELEASE** if export preflight reports missing station/tooling/machine/BOM requirements
- [ ] **BLOCK RELEASE** if deterministic re-run produces divergent station/tooling/G-code output for same inputs
- [ ] **BLOCK RELEASE** if cross-system validation results are inconsistent
- [ ] **BLOCK RELEASE** if any required sign-off is missing or marked `Blocked`
- [ ] **BLOCK RELEASE** if critical warnings are suppressed, hidden, or not actionable
- [ ] Release may proceed only when all checklist items are complete and all blocker conditions are cleared
