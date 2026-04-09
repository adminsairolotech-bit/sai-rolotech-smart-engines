# HEAD_DEV_20_CATEGORIES

## 1) Architecture
### Description
Defines the end-to-end technical structure for a roll forming engineering platform (geometry ingestion → flower pattern → roll tooling → simulation → CNC-safe G-code → deterministic export), ensuring deterministic outcomes and traceable engineering decisions.

### Key Responsibilities
- Establish bounded modules for DXF import, centerline normalization, flower generation, roll tooling synthesis, CNC generation, safety validation, and export packaging.
- Enforce deterministic processing order so identical inputs produce identical pass schedules, tool geometry, and G-code.
- Define clear contracts between React frontend, Node/Express orchestration APIs, and Python engineering kernels.
- Maintain canonical units (mm, degrees, m/min) and conversion rules across all pipelines.
- Design failure-tolerant workflows with explicit blocked/incomplete/complete station states.

### Audit Checkpoints
- Architecture diagram reflects actual deployed services and data flow.
- Each engineering stage has an explicit input/output schema with units.
- Re-run reproducibility check confirms bitwise-stable core artifacts for fixed seed/input.
- No hidden side effects in geometry transforms or station generation.

### Quality Gates
- Determinism test suite passes for 3 repeated runs on same project data.
- All service interfaces are versioned and backward-compatibility validated.
- Unit consistency checks pass for every boundary between services.

### Tools/Technologies
- TypeScript strict mode, Python FastAPI, Node/Express.
- OpenAPI/JSON Schema contracts.
- Deterministic serialization (stable key ordering) and seed-controlled algorithms.

---

## 2) CNC Safety
### Description
Owns machine-operational safety rules in toolpath generation and validation to prevent crashes, over-travel, and hazardous motions in roll forming CNC execution.

### Key Responsibilities
- Implement collision prevention checks against roll envelopes, shaft clearances, and guard zones.
- Enforce safe Z movement policies for approach/retract and inter-station travel.
- Validate feed, spindle, and tool engagement transitions to avoid unsafe step-changes.
- Gate CNC-ready status on quantitative safety scoring and hard-fail critical violations.
- Ensure emergency stop metadata and operator warnings are embedded in setup instructions.

### Audit Checkpoints
- Collision prevention validator flags roll/tool/fixture intersections with reproducible evidence.
- Safe Z movement is present before lateral XY repositioning in all generated programs.
- Soft-limit and machine envelope checks run for every station program.
- Safety score and blocking reasons are visible in reports and UI.

### Quality Gates
- Safety validator score meets or exceeds project threshold (e.g., ≥ 70) for CNC release.
- Zero critical collision-prevention violations.
- 100% of rapid moves include verified safe Z clearances.

### Tools/Technologies
- G-code parser/linter with geometric collision engine.
- Digital machine envelope model and kinematic constraints.
- Rule-based safety validator with signed audit logs.

---

## 3) Export Engine
### Description
Controls deterministic packaging of manufacturing outputs (G-code, setup sheets, BOM, tooling metadata, geometry snapshots) so the shop floor receives complete, repeatable, and safe artifacts.

### Key Responsibilities
- Generate deterministic ZIP/CSV/XML/DXF outputs with stable naming, ordering, and checksums.
- Block export when required station data is missing or safety validation has not passed.
- Include collision prevention summaries and safe Z movement compliance in export preflight.
- Package machineData, bomResult, station status matrix, and validation traceability.
- Preserve version/commit hash and parameter provenance for every export bundle.

### Audit Checkpoints
- Two exports from identical inputs yield deterministic outputs (matching hashes except timestamps if excluded).
- Export preflight lists blocking stations and explicit reasons.
- Safe Z movement and collision prevention results are included in export manifest.
- All mandatory artifacts exist and are non-empty.

### Quality Gates
- Deterministic output verification passes.
- Preflight has zero blockers (missing profile, incomplete stations, missing machine/BOM data).
- CNC safety report attached and passing before downloadable package is enabled.

### Tools/Technologies
- Structured export schemas (XML/CSV/JSON).
- Hashing/signature tools for artifact integrity.
- Archiving pipeline with manifest + provenance metadata.

---

## 4) DXF Processing
### Description
Manages ingestion and normalization of CAD profiles into robust manufacturing geometry, with resilient handling of malformed drawings and unit ambiguity.

### Key Responsibilities
- Parse lines/arcs/splines and normalize into validated centerline/inner/outer profiles.
- Detect and correct malformed input handling scenarios (self-intersections, open loops, duplicate vertices, invalid entities).
- Standardize coordinate systems, orientation, layer filters, and unit normalization.
- Run geometry healing with tolerance-based snapping and continuity repair.
- Emit explicit error/warning reports when conversion assumptions are applied.

### Audit Checkpoints
- Normalization report includes unit detection, transforms, and repaired entities.
- Malformed input handling test corpus produces deterministic error codes.
- Geometry closure and segment continuity checks are recorded.
- Rejected entities are listed with source layer/entity references.

### Quality Gates
- Geometry validity score passes minimum threshold.
- No unresolved self-intersections or unbounded segments in production path.
- All malformed input cases either corrected with trace or blocked with actionable errors.

### Tools/Technologies
- DXF parsers (e.g., ezdxf-like stack), computational geometry kernels.
- Robust polygon/curve libraries with tolerance controls.
- Geometry validation dashboards and repair logs.

---

## 5) Roll Tooling
### Description
Owns synthesis and validation of roll tooling per station, ensuring pass-by-pass formability, manufacturability, and machine compatibility.

### Key Responsibilities
- Generate roll profiles from normalized geometry and pass schedule constraints.
- Validate bend progression, pass distribution, and roll gap consistency.
- Ensure tooling dimensions respect shaft, spacer, and stand constraints.
- Compute and verify forming angles/bend angles per station.
- Flag incomplete stations and support regeneration workflows.

### Audit Checkpoints
- Each station has traceable rollProfile source parameters.
- Bend angle continuity across stations is within engineering tolerance.
- Tooling collisions and over-constraint checks executed.
- Incomplete stations are explicitly classified and reported.

### Quality Gates
- All required stations classified Complete prior to release.
- Tool geometry passes manufacturability and machine-fit checks.
- Roll gap and thickness limits pass material-specific constraints.

### Tools/Technologies
- Parametric roll profile generators.
- Constraint solvers and geometric interference checks.
- Station validation framework (complete/incomplete/no-profile/blocked).

---

## 6) Flower Pattern
### Description
Leads development of the flower pattern engine that defines intermediate bend states and pass transitions for controlled progressive forming.

### Key Responsibilities
- Compute target bend progression across passes with springback-aware overbend targets.
- Ensure flower angles align with material behavior and minimum radius constraints.
- Provide deterministic pass allocation and reproducible angle schedules.
- Detect infeasible progression (cracking risk, excessive strain concentration).
- Feed validated bend states downstream to roll tooling and simulation.

### Audit Checkpoints
- Flower output includes per-pass target angle and compensated overbend.
- Deterministic replay yields identical pass distribution.
- Constraint violations are categorized (material, geometry, machine).
- Transition smoothness metrics are captured and reviewed.

### Quality Gates
- No pass violates max incremental bend thresholds.
- Material-aware constraints pass (thickness/radius/speed compatibility).
- Flower output approved by engineering validation before tooling generation.

### Tools/Technologies
- Forming progression algorithms.
- Material rule libraries and springback models.
- Deterministic numeric computation pipeline.

---

## 7) Simulation / Digital Twin
### Description
Maintains a digital twin of forming and machine behavior to predict defects, verify kinematics, and reduce shop-floor trial iterations.

### Key Responsibilities
- Simulate station-by-station profile evolution and machine motion envelopes.
- Validate expected final geometry against tolerance bands.
- Run what-if analyses for line speed, material variation, and pass changes.
- Surface collision, wrinkling, twist, and springback risk indicators.
- Synchronize simulation inputs with exported manufacturing package versions.

### Audit Checkpoints
- Digital twin configuration matches machine and tooling revision.
- Simulated vs target geometry deviation report is archived.
- Collision envelope overlap checks are logged per station.
- Model assumptions and limitations are explicitly documented.

### Quality Gates
- Final profile deviation within specified tolerances.
- No unresolved simulated collisions in planned sequence.
- Simulation sign-off required for new/reworked tooling families.

### Tools/Technologies
- Geometric/kinematic simulation engines.
- 3D visualization and station playback tools.
- Versioned twin parameter sets linked to project IDs.

---

## 8) API Design
### Description
Defines stable, engineering-safe service interfaces for geometry, tooling, simulation, G-code, and export operations.

### Key Responsibilities
- Create explicit schemas for engineering entities with units and validity constraints.
- Enforce idempotent endpoints for deterministic generation requests.
- Provide async job orchestration for heavy compute tasks with trace IDs.
- Return machine-actionable error categories (validation, safety, geometry, persistence).
- Maintain versioned API contracts for backward compatibility.

### Audit Checkpoints
- OpenAPI spec matches actual request/response payloads.
- Idempotency keys produce identical outputs for repeated requests.
- Error responses include actionable codes and station context.
- Contract tests pass across frontend/backend/python services.

### Quality Gates
- 100% of production endpoints schema-validated.
- Breaking changes gated behind version bumps and migration plans.
- API latency and timeout thresholds met for interactive workflows.

### Tools/Technologies
- OpenAPI, JSON Schema, typed client generation.
- Express/FastAPI validators.
- Distributed tracing and correlation IDs.

---

## 9) Database / Persistence
### Description
Owns durable storage of project geometry, station states, validation outcomes, and artifact lineage with engineering traceability.

### Key Responsibilities
- Model immutable engineering snapshots and mutable working drafts.
- Persist station classifications, safety scores, and export manifests.
- Support deterministic artifact retrieval by project version and commit hash.
- Ensure transactional integrity for multi-step generation pipelines.
- Implement retention and archival policies for audit/regulatory needs.

### Audit Checkpoints
- Snapshot/revision history is complete and queryable.
- Foreign key integrity maintained across project, station, tooling, and export tables.
- Recovery drills verify no loss of critical manufacturing records.
- Audit trail captures who/when/what for engineering-significant changes.

### Quality Gates
- Zero data corruption in migration and rollback tests.
- Point-in-time recovery validated at scheduled intervals.
- All safety-critical writes are transactionally atomic.

### Tools/Technologies
- Relational DB (e.g., PostgreSQL), migrations, backup tooling.
- Event/audit tables with immutable logs.
- Checksummed artifact/object storage.

---

## 10) Auth / Security
### Description
Secures engineering IP and machine-affecting operations with robust authentication, authorization, and tamper-resistant auditability.

### Key Responsibilities
- Enforce role-based access for design, approval, safety override, and release actions.
- Protect CNC/G-code generation and export endpoints behind elevated permissions.
- Sign and verify critical artifacts to prevent tampered machine instructions.
- Log security-relevant actions (safety gate override, release approvals, export downloads).
- Apply least-privilege access to project and machine configuration data.

### Audit Checkpoints
- Role matrix aligns with real operational responsibilities.
- Privileged actions require explicit authenticated identity.
- Security logs are immutable and reviewable.
- Secrets and tokens are rotated per policy.

### Quality Gates
- No critical auth vulnerabilities in periodic security scans.
- Mandatory MFA/enhanced auth for release and override actions.
- Artifact signature verification passes before machine handoff.

### Tools/Technologies
- OAuth/OIDC, JWT/session hardening.
- RBAC/ABAC policy engine.
- Signed artifacts, SIEM-compatible audit logging.

---

## 11) Frontend State Management
### Description
Controls UI state for geometry, station readiness, safety, and export eligibility without stale or optimistic manufacturing signals.

### Key Responsibilities
- Maintain canonical station readiness states (Complete / Incomplete / No Profile / Blocked).
- Prevent unsafe optimistic UI success when backend data is partial/blocked.
- Show explicit reasons for disabled actions (generate/export/release).
- Null-guard rollProfile, bendAngles, machineData, bomResult, and geometry segments.
- Coordinate long-running generation jobs with timeout + visible error states.

### Audit Checkpoints
- State transitions match backend validation data and are reproducible.
- Empty/loading/error fallbacks exist for all key panels.
- Disabled controls display exact blocking reason text.
- No unsafe member access in rendering paths.

### Quality Gates
- UI never shows green success for partial/synthesized/empty outputs.
- 100% of station cards render without crash on null/partial payloads.
- Export button only enabled when preflight conditions are satisfied.

### Tools/Technologies
- Zustand (getState in callbacks), React query/state orchestration.
- TypeScript strict null checks.
- Component-level guards and fallback UI patterns.

---

## 12) Engineering Validation
### Description
Defines and enforces engineering correctness checks across geometry, forming progression, tooling, CNC safety, and final manufacturability.

### Key Responsibilities
- Implement validation chains from DXF integrity to final G-code safety score.
- Verify dimensional tolerances, bend feasibility, and material constraints.
- Provide clear pass/fail diagnostics tied to station and feature IDs.
- Maintain rule libraries for material-specific warnings/critical warnings.
- Ensure deterministic validation results for identical input datasets.

### Audit Checkpoints
- Validation reports include all rule outcomes with thresholds and units.
- Failed checks map to corrective actions for operators/engineers.
- Rule changes are versioned and impact-assessed.
- Cross-stage consistency checks detect contradictory outputs.

### Quality Gates
- All mandatory validation rules pass before CNC-ready labeling.
- Zero unresolved critical warnings at release time.
- Validation reproducibility confirmed across repeated executions.

### Tools/Technologies
- Rule engines, tolerance libraries, unit-aware validators.
- Structured validation reports (JSON + human-readable summaries).
- Material database integration.

---

## 13) BOM
### Description
Ensures bill-of-material generation is accurate, machine-compatible, and synchronized with tooling/export artifacts for procurement and setup.

### Key Responsibilities
- Generate BOM from validated tooling, machine configuration, and station plan.
- Validate part numbers, quantities, material grades, and revision levels.
- Link BOM entries to station/tool references and export package contents.
- Detect missing/duplicate components and incompatible substitutions.
- Provide deterministic BOM ordering for diffability and approvals.

### Audit Checkpoints
- BOM lines map to actual tooling and machine assemblies.
- Revision control reflects latest approved engineering snapshot.
- Missing critical components are flagged as release blockers.
- Exported BOM format matches downstream ERP/MES expectations.

### Quality Gates
- Zero unresolved BOM validation errors.
- Mandatory components for all complete stations are present.
- BOM hash stable across repeated generation with unchanged inputs.

### Tools/Technologies
- BOM generation service and validators.
- Parts master integration (ERP/PLM sync).
- CSV/XML export with schema checks.

---

## 14) Testing Strategy
### Description
Builds verification strategy for deterministic, safe, and correct behavior across geometry pipelines and machine-output artifacts.

### Key Responsibilities
- Maintain regression suites for DXF parsing, flower, tooling, safety, and export pipelines.
- Maintain golden test cases for deterministic outputs (station profiles, G-code, export manifests).
- Add malformed-input and edge-case tests for geometry/cad ingestion.
- Include integration tests that simulate full project lifecycle from DXF to export.
- Enforce non-flaky thresholds for numeric tolerance-based assertions.

### Audit Checkpoints
- Regression failures are triaged with root cause and affected bucket.
- Golden test cases are updated only with explicit engineering sign-off.
- Coverage includes null/partial/blocked station scenarios.
- Safety-related tests cover collision prevention and safe Z movement.

### Quality Gates
- Regression suite passes on protected branches.
- Golden test case diffs approved by designated engineering owners.
- No release if safety or determinism tests fail.

### Tools/Technologies
- Unit/integration/E2E frameworks (TS + Python).
- Snapshot/golden artifact comparison tooling.
- Synthetic CAD corpus for malformed/edge-case validation.

---

## 15) CI/CD Pipeline
### Description
Automates validated build-test-release workflow with manufacturing safety gates and deterministic artifact promotion.

### Key Responsibilities
- Run staged pipelines: lint → unit tests → integration → safety checks → package signing.
- Enforce artifact immutability and traceability between commit and release bundle.
- Block deploy on safety, determinism, or validation regressions.
- Publish reproducible build metadata and test evidence.
- Support rollback with preserved approved artifacts.

### Audit Checkpoints
- Pipeline logs show every mandatory stage executed.
- Build provenance links commit, config, and produced export bundle.
- Deployment approvals include safety gate evidence.
- Rollback procedure tested and documented.

### Quality Gates
- 100% mandatory pipeline stages pass before promotion.
- Signed artifacts only; unsigned outputs cannot be released.
- Deterministic build verification passes for release candidates.

### Tools/Technologies
- CI runners (GitHub Actions/GitLab CI/Jenkins).
- Artifact repository with signing and checksum verification.
- Policy-as-code gates for safety and quality enforcement.

---

## 16) Performance
### Description
Optimizes compute and interaction latency for heavy geometry and tooling workflows without sacrificing deterministic and safe outputs.

### Key Responsibilities
- Profile DXF normalization, flower generation, tooling synthesis, and simulation hotspots.
- Optimize large-geometry handling and station-scale computations.
- Enforce predictable runtime limits for operator-facing workflows.
- Cache safe intermediate results with strict invalidation rules.
- Monitor API and UI responsiveness under production-size projects.

### Audit Checkpoints
- Benchmark suite tracks p50/p95 runtime by pipeline stage.
- Performance regressions tied to commits and feature flags.
- Memory usage bounded for large CAD datasets.
- Caching does not alter deterministic final outputs.

### Quality Gates
- Stage-specific latency SLOs met (interactive + batch).
- No memory/timeout failures on reference large-project corpus.
- Deterministic equality retained after optimization changes.

### Tools/Technologies
- Profilers for Node/Python, tracing APM tools.
- Geometry algorithm optimization and vectorized math.
- Benchmark harness with fixed datasets.

---

## 17) Error Handling
### Description
Ensures failures are explicit, actionable, and safe, preventing silent corruption or unsafe machine instructions.

### Key Responsibilities
- Propagate structured error states for geometry, tooling, safety, export, and persistence failures.
- Prevent success messaging when output is partial, blocked, or synthesized fallback.
- Provide operator-focused remediation guidance per failure class.
- Standardize error codes and severity levels (warning/critical/blocking).
- Preserve error context (station index, entity ID, operation phase).

### Audit Checkpoints
- No swallowed exceptions in backend/frontend critical paths.
- Error reports include actionable next steps.
- Blocking errors correctly disable unsafe actions.
- Observability captures stack + domain context for incident analysis.

### Quality Gates
- Zero silent failures in validation and export flows.
- All blocking failures surface in UI and API responses.
- Error taxonomy conformance verified in contract tests.

### Tools/Technologies
- Structured logging and centralized error tracking.
- Typed error classes and standardized API problem responses.
- UI warning/critical panels with audit-friendly messaging.

---

## 18) Documentation Standards
### Description
Maintains precise, versioned engineering documentation tied to machine behavior, validation rules, and release artifacts.

### Key Responsibilities
- Document algorithms, assumptions, tolerances, and unit conventions.
- Maintain runbooks for DXF issues, tooling regeneration, and safety blockers.
- Keep API schemas, station classification rules, and export preflight criteria current.
- Require change notes for rule modifications impacting manufacturability.
- Publish operator-facing guidance for interpreting warnings and critical alerts.

### Audit Checkpoints
- Docs version matches software release and rule set version.
- Every critical validation rule has documented rationale and thresholds.
- Troubleshooting guides cover top recurring failure modes.
- Release notes reference safety-impacting changes explicitly.

### Quality Gates
- No release without updated docs for user-visible engineering changes.
- Documentation lint/check completeness passes.
- Operator and developer docs both updated for safety-relevant changes.

### Tools/Technologies
- Markdown docs with versioning.
- Auto-generated API docs from OpenAPI.
- Architecture decision records (ADRs) and runbook templates.

---

## 19) Code Review Process
### Description
Implements engineering-focused peer review to prevent unsafe, non-deterministic, or geometrically incorrect changes from reaching production.

### Key Responsibilities
- Require reviewers with domain coverage (geometry, tooling, CNC safety as applicable).
- Validate that changes preserve deterministic outputs and station classification logic.
- Enforce evidence: tests, benchmarks, and safety validator results.
- Check null-safety and fallback UI in frontend changes.
- Ensure no bypass of export/CNC safety preflight checks.

### Audit Checkpoints
- PR checklist includes impacted audit bucket(s) and risk statement.
- Review comments verify collision prevention and safe Z implications when G-code paths change.
- Golden/regression diffs attached for algorithmic modifications.
- Approval matrix enforces multi-review for safety-critical files.

### Quality Gates
- Minimum approval count with at least one safety/domain reviewer.
- Required checks (tests + safety + determinism) all green.
- No unresolved critical review comments at merge time.

### Tools/Technologies
- Pull request templates with manufacturing-specific checklist.
- CODEOWNERS and branch protection.
- Diff tools for geometry, G-code, and export manifests.

---

## 20) Release Management
### Description
Owns controlled promotion of manufacturing software and artifacts to production with explicit safety gate checks and rollback readiness.

### Key Responsibilities
- Run release preflight including CNC safety, deterministic export verification, and engineering validation status.
- Require safety gate checks before tagging or distributing machine-affecting outputs.
- Coordinate staged rollout and compatibility checks with plant/machine configurations.
- Maintain rollback plans for software and artifact versions.
- Archive signed release evidence (test results, safety reports, manifests).

### Audit Checkpoints
- Safety gate checks are recorded with approver identity and timestamps.
- Release candidate artifacts match tested commit and checksums.
- Rollback rehearsal evidence exists for current release line.
- Post-release monitoring confirms no safety/quality regressions.

### Quality Gates
- Release blocked if any safety gate checks fail.
- Deterministic output and regression suites must pass for release candidate.
- All mandatory approvals (engineering + safety + operations) completed.

### Tools/Technologies
- Release orchestration and artifact promotion tools.
- Signed release manifests, checksum verification.
- Change management records and deployment dashboards.
