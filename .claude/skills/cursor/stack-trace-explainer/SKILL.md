# Stack Trace Explainer

## Triggers
- User shares stack trace
- User says "stack trace", "error trace", "crash log"

## What It Does

### Trace Analysis
```
STACK TRACE
        ↓
1. PARSE
   → Error type
   → Error message
   → Frame by frame
        ↓
2. LOCATE
   → Your code vs library
   → Root cause frame
   → Relevant variables
        ↓
3. EXPLAIN
   → Plain English
   → Why it happened
   → How to fix
        ↓
OUTPUT: Explanation
```

### Output Format
```
# Stack Trace Analysis

## Error: TypeError: Cannot read property 'x' of undefined

## What Happened
At line 42 in `src/utils/helper.ts`, the code tried to access 
`.x` on an object that was `undefined`.

## Call Stack (bottom to top)
```
1. parseResponse() - src/utils/parser.ts:42
   └─ 2. handleData() - src/handlers/data.ts:15
        └─ 3. processRequest() - src/server.ts:89
```

## Root Cause
The API returned `null` instead of expected JSON object.

## How to Fix
```typescript
// ❌ Before
const result = data.user.profile.name;

// ✅ After
const result = data?.user?.profile?.name ?? 'Anonymous';
```

## Prevention
1. Use optional chaining
2. Validate API responses
3. Add null checks
```

## Commands
| Command | Action |
|---------|--------|
| `explain trace` | Full analysis |
| `find error` | Root cause |
| `suggest fix` | How to fix |
