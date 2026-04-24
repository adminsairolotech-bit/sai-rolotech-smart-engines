# Cursor Rules Writer

## Triggers
- User wants to create Cursor IDE rules
- User says "Cursor rules", ".cursor/rules", "AGENTS.md"

## What It Does

### Rules Structure
```
PROJECT CONTEXT
        ↓
1. PROJECT RULES
   → Tech stack
   → Coding conventions
   → Patterns to follow
   → Patterns to avoid
        ↓
2. GENERATE RULES
   → .cursor/rules format
   → Clear instructions
   → Examples
   → Edge cases
        ↓
OUTPUT: Cursor rules file
```

### Output Format
```markdown
# .cursor/rules

## Project Context
- TypeScript + React + Tailwind
- App: Customer portal for SaaS
- Backend: Express + PostgreSQL

## Code Style

### TypeScript
- Use explicit types, avoid `any`
- Interface over Type for objects
- Use `type` for unions/primitives

### React
- Functional components only
- Custom hooks for logic
- Co-locate tests with components

### File Structure
```
src/
├── components/     # UI components
├── hooks/          # Custom hooks
├── services/       # API calls
├── utils/         # Pure functions
└── types/         # TypeScript types
```

## Patterns

### API Calls
- Use custom hooks
- Handle loading/error states
- Return { data, loading, error }

### State Management
- Local state: useState
- Shared state: Zustand
- Server state: React Query
```

## Commands
| Command | Action |
|---------|--------|
| `write rules` | Generate rules |
| `add convention` | Add style rule |
