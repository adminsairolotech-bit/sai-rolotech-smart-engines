## Summary
- **What changed?**
  - 
- **Why was this change needed?**
  - 
- **Which audit bucket(s) are touched?**
  - [ ] 1. DXF import and geometry normalization
  - [ ] 2. Centerline / inner / outer conversion
  - [ ] 3. Flower pattern engine
  - [ ] 4. Roll tooling engine
  - [ ] 5. Export engine (ZIP, CSV, XML, DXF)
  - [ ] 6. Simulation / Digital Twin / Package views
  - [ ] 7. G-code / CNC safety
  - [ ] 8. Auth / backend / persistence

## Type of Change
- [ ] Safety-critical fix (CNC / G-code / machine constraints)
- [ ] Feature (new capability)
- [ ] Bug fix (non-breaking)
- [ ] Breaking change
- [ ] Refactor / technical debt
- [ ] Documentation / process update
- [ ] Test-only change

## ADR Requirement (Mandatory)
> **All non-trivial, safety-relevant, architecture, or workflow changes MUST reference an ADR.**

- [ ] ADR required for this PR
- [ ] ADR not required (purely cosmetic or comment-only)
- **ADR Link(s) (MANDATORY when ADR required):**
  - 
- **ADR Status:**
  - [ ] Proposed
  - [ ] Accepted
  - [ ] Superseded (link replacement ADR)

## Impacted Systems
- [ ] DXF import / geometry normalization
- [ ] Centerline conversion / profile math
- [ ] Flower pattern generation
- [ ] Roll tooling generation
- [ ] Station readiness classification
- [ ] G-code generation
- [ ] CNC safety validator
- [ ] Export package (ZIP/CSV/XML/DXF)
- [ ] Simulation / Digital Twin
- [ ] API / backend persistence
- [ ] UI/UX only (no logic changes)

### Stations / Flow Impact Details
- **Geometry prerequisites affected?**
  - [ ] Yes
  - [ ] No
- **Station completeness behavior changed?**
  - [ ] Yes
  - [ ] No
- **Operator next-action guidance changed?**
  - [ ] Yes
  - [ ] No

## CNC Safety Checklist (Must Pass for CNC-affecting PRs)
- [ ] Safe Z moves are present and verified for all rapid transitions.
- [ ] Bend direction logic is correct and validated against expected tool orientation.
- [ ] G-code safety validator executed and **score >= 70**.
- [ ] No synthesized/partial/blocked output is labeled CNC-ready.
- [ ] Any safety warnings/errors are surfaced in UI/API (not silently swallowed).

### CNC Safety Evidence
- **Validator command / endpoint used:**
  - 
- **Validator score:**
  - 
- **Key warning/error outputs reviewed:**
  - 

## Testing
### Automated
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Regression tests for safety-critical paths added/updated
- [ ] Existing test suite passes

### Manual
- [ ] Null/empty/partial data rendering verified (no crashes)
- [ ] Loading, error, and empty-state fallbacks verified
- [ ] Disabled buttons show explicit reason
- [ ] No false-success toast for partial/blocked/empty results

### Commands / Runs
```bash
# paste exact commands and outcomes
```

## Validation Evidence
- **Normal path evidence:**
  - 
- **Edge-case evidence:**
  - 
- **Export output evidence (if applicable):**
  - 
- **Screenshots / logs / artifacts:**
  - 

## Risk Assessment
- **Risk level:**
  - [ ] Low
  - [ ] Medium
  - [ ] High
  - [ ] Critical
- **Primary risks introduced:**
  - 
- **Mitigations implemented:**
  - 
- **Rollback plan:**
  - 

## Backward Compatibility
- [ ] Backward compatible
- [ ] Breaking change
- **If breaking, describe migration and operator impact:**
  - 
- **Data/schema/API compatibility notes:**
  - 

## Reviewer Checklist
- [ ] Business logic matches roll-forming domain rules.
- [ ] Station classifications are backed by real validation data.
- [ ] Null safety guards exist for rollProfile, bendAngles, geometry, machineData, bomResult.
- [ ] Export preflight blocks unsafe/incomplete states with explicit station reasons.
- [ ] Springback / overbend behavior is accurate and visible where required.
- [ ] Material-aware warnings (warning + critical) are correct.
- [ ] CNC safety evidence is complete and validator threshold is met.
- [ ] Tests are sufficient for normal + edge cases.
- [ ] ADR linkage is present when required.

## Merge Rules (Strict Blocking)
> **Do not merge until EVERY required item below is satisfied.**

### Hard Blocks (Merge MUST be blocked if any are true)
- [ ] PR has unresolved review comments.
- [ ] Required checks/tests are failing or missing.
- [ ] ADR is required but link/status is missing.
- [ ] Safety-affecting change lacks CNC validator evidence or score < 70.
- [ ] Any required station can remain without rollProfile due to this change.
- [ ] Export can proceed with incomplete stations or missing machine/BOM data.
- [ ] UI can show false success for partial/synthesized/blocked/empty outputs.
- [ ] Null/empty/error state regressions are unaddressed.

### Final Merge Attestation
- [ ] I attest this change does **not** reduce CNC safety or hide safety-critical failures.
- [ ] I attest validation evidence in this PR is complete and truthful.
- **Approver name(s):**
  - 
