# Legacy Code Modernizer

## Triggers
- User wants to modernize old code
- User says "modernize", "upgrade legacy", "old code", "refactor old"

## What It Does

### Modernization Steps
```
LEGACY CODE
        ↓
1. ASSESS
   → How old?
   → What patterns used?
   → Dependencies current?
   → Tests exist?
        ↓
2. PLAN
   → Modern equivalents
   → Migration steps
   → Test strategy
   → Rollback plan
        ↓
3. EXECUTE
   → Update dependencies
   → Modernize syntax
   → Add types
   → Update patterns
        ↓
OUTPUT: Modern code + plan
```

### Common Upgrades
| Old | Modern |
|-----|--------|
| Callback | async/await |
| var | let/const |
| jQuery | Vanilla JS/React |
| CommonJS | ES Modules |
| Class components | Hooks |
| MongoDB driver | Mongoose/Prisma |

## Commands
| Command | Action |
|---------|--------|
| `modernize` | Full plan |
| `convert to hooks` | Class → Hooks |
| `add types` | Add TypeScript |
