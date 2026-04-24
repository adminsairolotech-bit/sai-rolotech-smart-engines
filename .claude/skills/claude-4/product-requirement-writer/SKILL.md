# Product Requirement Writer

## Triggers
- User wants to write a product requirement document
- User says "PRD", "requirements", "spec", "user stories"

## What It Does

### PRD Structure
```
FEATURE IDEA
        ↓
1. PROBLEM STATEMENT
   → What problem does this solve?
   → Who has this problem?
   → Current workaround?
        ↓
2. USER STORIES
   → Who is the user?
   → What do they want?
   → Why do they want it?
   → How do they use it?
        ↓
3. FUNCTIONAL REQUIREMENTS
   → What the system must do
   → User interactions
   → Data handling
   → Edge cases
        ↓
4. NON-FUNCTIONAL REQUIREMENTS
   → Performance
   → Security
   → Scalability
   → Accessibility
        ↓
5. ACCEPTANCE CRITERIA
   → How to know it's done?
   → Test scenarios
   → Success metrics
        ↓
OUTPUT: Complete PRD
```

### Output Format
```
# Product Requirement Document

## 1. Overview

### Feature Name
{Feature Name}

### Problem Statement
{What problem are we solving?}

### Target Users
- Primary: {User type}
- Secondary: {User type}
- Total affected: {X} users

### Business Impact
- Revenue impact: {+/- ₹X}
- User impact: {X} users affected
- Strategic value: {High/Med/Low}

## 2. User Stories

### US-1: {Story Title}
**As a** {user type}
**I want to** {action}
**So that** {benefit}
**Priority:** Must Have / Should Have / Could Have
**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}

### US-2: {...}
...

## 3. Functional Requirements

### FR-1: {Requirement Title}
**Description:** {What system must do}
**Input:** {What data required}
**Output:** {What system produces}
**Logic:** {Business rules}
**Priority:** {P0/P1/P2}
**Dependencies:** {FR-X, FR-Y}

### FR-2: {...}
...

## 4. User Flows

### Happy Path
```
[User Action] → [System Response] → [User Action] → [System Response]
```

### Alternative Flows
1. {Flow description}
2. {Flow description}

### Error Flows
1. {Error condition} → {User message} → {Recovery action}

## 5. Wireframes/Mockups
{Attach or link to designs}

## 6. Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Performance | < 2s load | p95 latency |
| Availability | 99.9% | Uptime monitor |
| Scalability | Support 10x users | Load test |
| Security | PCI-DSS compliant | Security audit |

## 7. Analytics & Metrics

### Key Metrics
- Primary: {Metric} (target: {X})
- Secondary: {Metric} (target: {X})

### Events to Track
- {event_name}: {description}
- {event_name}: {description}

## 8. Dependencies

### External
- {Dependency}: {Impact if delayed}

### Internal
- {Feature}: {Depends on}

### Blockers
- {Blocker}: {How to resolve}

## 9. Timeline

### Phase 1 (MVP)
- Target: {Date}
- Scope: {What's in}
- What's out: {What's out}

### Phase 2 (V2)
- Target: {Date}
- Scope: {What's in}

## 10. Acceptance Criteria

### AC-1: {Criteria}
**Given** {precondition}
**When** {action}
**Then** {expected result}

### AC-2: {...}

## 11. Test Scenarios

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| T1 | {Scenario} | {Steps} | {Result} | P0 |
| T2 | {...} | | | |

## 12. Rollout Plan

### Phase 1: Beta (X% of users)
- Start: {Date}
- Success criteria: {Criteria}
- Rollback trigger: {Trigger}

### Phase 2: Full rollout
- Start: {Date}
- Success criteria: {Criteria}

## 13. Appendix

### Glossary
{Key terms defined}

### Related Documents
- {Link to designs}
- {Link to technical spec}
- {Link to research}
```

## Commands
| Command | Action |
|---------|--------|
| `write prd <feature>` | Full PRD |
| `write user story` | User story format |
| `write acceptance criteria` | AC only |
| `write spec` | Technical spec |