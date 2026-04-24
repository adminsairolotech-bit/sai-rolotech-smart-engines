# Spec-to-Code Planner

## Triggers
- User wants to convert requirements to implementation plan
- User says "plan this", "how to build", "implementation", "break down"

## What It Does

### Planning Process
```
REQUIREMENT/SPEC
        ↓
1. UNDERSTAND REQUIREMENT
   → What needs to be built
   → Key features and functions
   → User interactions
   → Data requirements
   → Integration points
        ↓
2. TECHNICAL DECOMPOSITION
   → Break into modules/components
   → Identify dependencies
   → Determine tech stack
   → Define data models
   → Design API contracts
        ↓
3. TASK BREAKDOWN
   → Large tasks → Smaller tasks
   → Estimate effort (hours/days)
   → Identify blockers
   → Prioritize tasks
        ↓
4. FILE STRUCTURE
   → What files to create/modify
   → Folder organization
   → Import dependencies
        ↓
OUTPUT: Implementation roadmap
```

### Output Format
```
# Implementation Plan: {Feature Name}

## Overview
{1-2 sentence description}

## Architecture

### Tech Stack
- Frontend: {Framework}
- Backend: {Framework}
- Database: {DB}
- Infrastructure: {Hosting}

### Data Models
```
{Model Name}
├── field1: Type (required/optional)
├── field2: Type
└── relations: {Related Model}
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/{resource} | List items |
| POST | /api/{resource} | Create item |
| GET | /api/{resource}/{id} | Get item |
| PUT | /api/{resource}/{id} | Update item |
| DELETE | /api/{resource}/{id} | Delete item |

## Task Breakdown

### Phase 1: Foundation ({X} hours)
- [ ] {Task 1} ({X}h)
- [ ] {Task 2} ({X}h)
- [ ] {Task 3} ({X}h)

### Phase 2: Core Features ({X} hours)
- [ ] {Task 1} ({X}h)
- [ ] {Task 2} ({X}h)

### Phase 3: Polish ({X} hours)
- [ ] {Task 1} ({X}h)
- [ ] {Task 2} ({X}h)

**Total Estimated Time:** {X} hours / {Y} days

## File Structure
```
src/
├── components/
│   └── {Feature}/
│       ├── {Feature}.tsx
│       └── {Feature}.test.tsx
├── hooks/
│   └── use{Feature}.ts
├── services/
│   └── {feature}Service.ts
├── types/
│   └── {feature}.ts
└── pages/
    └── {feature}/
        └── index.tsx
```

## Dependencies
### NPM Packages
- {package}: {version}

### External APIs
- {API Name}: {Purpose}

### Environment Variables
- {VAR_NAME}: {Description}

## Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| {Risk} | High/Med/Low | {Action} |

## Next Steps
1. {First action to take}
2. {Second action}
3. {Third action}
```

## Commands
| Command | Action |
|---------|--------|
| `plan <feature>` | Full implementation plan |
| `breakdown <task>` | Task breakdown |
| `estimate <task>` | Time estimation |
| `dependencies <task>` | Show dependencies |