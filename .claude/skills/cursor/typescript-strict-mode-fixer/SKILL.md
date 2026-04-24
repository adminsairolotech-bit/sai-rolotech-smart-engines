# TypeScript Strict Mode Fixer

## Triggers
- User has TypeScript errors
- User says "type error", "TypeScript", "strict", "any type"

## What It Does

### Fix Categories
```
SYNTAX: Missing types, wrong types
GENERICS: Generic type issues
INTERFACES: Missing/exports
ANY: Replace any with proper types
NULL: Null/undefined handling
```

### Output Format
```typescript
// ❌ Before (Error)
function processData(data: any) {
  return data.map(x => x.value);
}

// ✅ After (Fixed)
interface DataItem {
  value: string;
  id: number;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

## Common Fixes

| Error | Fix |
|-------|-----|
| `any` type | Use specific interface |
| `undefined` | Use optional (?) or default |
| `unknown` | Add type guard |
| Missing return | Add return type |
| Parameter type | Add explicit type |

## Commands
| Command | Action |
|---------|--------|
| `fix types` | Fix all TS errors |
| `add interface` | Create type |
| `replace any` | Type-safe alternative |
