# ADR Template — Roll Forming Machine Software

## 1) ADR Metadata

- **ADR ID:** `ADR-YYYY-NNN`
- **Title:** `<Short, decision-focused title>`
- **Date (UTC):** `YYYY-MM-DD`
- **Status:** `Proposed | Accepted | Rejected | Deprecated | Superseded`
- **Deciders:** `<Names / roles accountable for final decision>`
- **Consulted:** `<SMEs, reviewers, operators, manufacturing engineers>`
- **Informed:** `<Teams/stakeholders notified of outcome>`
- **Tags:** `<e.g., geometry, dxf, tooling, simulation, cnc, export, safety-critical>`

---

## 2) Context & Problem Statement

### System Context
Describe where this decision applies in the roll forming platform (e.g., DXF import, geometry normalization, flower pattern generation, roll tooling synthesis, digital twin simulation, CNC export).

### Problem Statement
State the decision that must be made and why now.

### Geometry Implications
Capture geometric constraints and assumptions that influence the decision:
- Profile complexity (open/closed sections, symmetry, corner radii)
- Material and thickness interactions with bend feasibility
- Pass distribution and forming sequence impacts
- Tolerance stack-up and downstream manufacturability

### CNC Safety Risks
Document safety-critical hazards if the wrong decision is made:
- Unsafe toolpaths / collision risk
- Over-travel, invalid feed/speed, or machine-limit violations
- Non-deterministic output causing operator uncertainty
- Export/package incompleteness leading to shop-floor errors

---

## 3) Decision Drivers

Rank and explain key drivers (highest priority first):

1. **Safety** (operator, machine, and part integrity; fail-safe behavior)
2. **Determinism** (same input → same output across runs/environments)
3. **Performance** (acceptable latency for engineering workflow)
4. **Maintainability** (clarity, testability, ease of change)
5. **Manufacturing Constraints** (material behavior, machine capabilities, QA requirements)

Optional additional drivers:
- Traceability / auditability
- Regulatory or customer compliance
- Cost of implementation and operation

---

## 4) Considered Options

> Include at least 2–4 realistic options, including “do nothing” when relevant.

### Option A — `<Name>`
**Description:**

**Pros:**
-

**Cons:**
-

**Known Failure Modes / Safety Concerns:**
-

### Option B — `<Name>`
**Description:**

**Pros:**
-

**Cons:**
-

**Known Failure Modes / Safety Concerns:**
-

### Option C — `<Name>` (optional)
**Description:**

**Pros:**
-

**Cons:**
-

**Known Failure Modes / Safety Concerns:**
-

---

## 5) Options Comparison Table

Score each option (example scale: `1 = poor`, `5 = excellent`) and justify briefly.

| Criterion | Weight (H/M/L) | Option A | Option B | Option C | Notes |
|---|---|---:|---:|---:|---|
| CNC Safety | H |  |  |  | |
| Determinism | H |  |  |  | |
| Complexity | M |  |  |  | |
| Performance | M |  |  |  | |
| Maintainability | H |  |  |  | |
| Delivery Risk | H |  |  |  | |

---

## 6) Decision Outcome

- **Selected Option:** `<Option X>`
- **Decision Summary:** `<1–3 sentence summary>`
- **Justification:**
  - Why this option best satisfies safety-critical and manufacturing constraints
  - Why rejected options were not chosen
  - Explicit trade-offs accepted by the team

If status is **Superseded**, include:
- **Superseded by:** `ADR-...`
- **Superseded date (UTC):** `YYYY-MM-DD`

---

## 7) Implementation Notes

### Modules / Services Affected
List concrete components, for example:
- Geometry pipeline (`dxf import`, `normalization`, `centerline/inner/outer conversion`)
- Flower pattern / pass schedule engine
- Roll tooling generation
- Simulation / digital twin
- CNC post-processor and export package

### Data Contract Changes
Define schema/API changes and compatibility:
- New/changed fields
- Nullability and defaults
- Versioning strategy

### Migration Plan
Describe rollout approach:
- Feature flags / phased rollout
- Backfill or conversion scripts
- Operator training / documentation updates

### Validation Strategy
Specify how correctness and safety are verified:
- Unit, integration, and regression tests
- Golden-file deterministic export checks
- CNC safety validator thresholds and expected outcomes
- Simulation correlation checks against baseline cases

---

## 8) Consequences

### Positive
-

### Negative
-

### Risks
-

### Mitigations
-

### Operational Impact
- Monitoring, alerts, fallback behavior, and incident response implications

---

## 9) Links & References

- **Related ADRs:** `ADR-...`
- **Pull Requests / Commits:** `<links>`
- **Audit Reports (DXF/Tooling/Simulation/GCode/Auth/etc.):** `<links>`
- **Design Docs / Specs:** `<links>`
- **Test Evidence / Dashboards:** `<links>`
- **Incident Tickets / Postmortems (if any):** `<links>`

---

## 10) Optional Validation Checklist

Mark as applicable and complete before moving to **Accepted**:

- [ ] **Geometry correctness validated** (profile integrity, radii, thickness assumptions)
- [ ] **Bend sequence validated** (pass order, angle progression, manufacturability)
- [ ] **CNC safety validated** (toolpath limits, collision checks, feed/speed constraints)
- [ ] **Simulation validated** (digital twin behavior aligns with expected forming outcomes)
- [ ] **Deterministic export verified** (identical inputs produce identical package outputs)
- [ ] **Error/empty-state handling reviewed** (no silent failures, actionable operator feedback)

---

## Safety-Critical Decision Note (Recommended)

For decisions affecting tooling generation, machine motion, or CNC output, explicitly document:
- Worst-case failure impact
- Safeguards and interlocks
- Manual override policy
- Required sign-off roles (e.g., manufacturing + controls + safety)
