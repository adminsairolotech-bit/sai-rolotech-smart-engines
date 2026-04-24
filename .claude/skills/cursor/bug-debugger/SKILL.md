# Bug Debugger

## Triggers
- User shares error or unexpected behavior
- User says "bug", "error", "not working", "crash", "debug"

## What It Does

### Debug Process
```
ERROR/BEHAVIOR
        ↓
1. UNDERSTAND THE ERROR
   → Error type (syntax/logic/runtime)
   → Error message parsing
   → Stack trace analysis
   → Line number identification
        ↓
2. LOCATE THE SOURCE
   → File search
   → Relevant code reading
   → Variable state analysis
   → Flow tracing
        ↓
3. IDENTIFY ROOT CAUSE
   → Why did error occur?
   → What assumptions failed?
   → Edge case triggered?
   → Related bugs?
        ↓
4. PROPOSE FIX
   → Minimal change
   → Test case for regression
   → Alternative approaches
   → Prevention strategies
        ↓
OUTPUT: Fix + explanation
```

### Output Format
```
# Bug Debug Report

## Error Summary
**Type:** {Runtime/Syntax/Logic/Logical}
**File:** `{file}:{line}`
**Severity:** 🔴 High / 🟠 Medium / 🟡 Low

## Error Message
```
{Exact error message}
```

## Root Cause
{1-2 sentence explanation of why this happened}

## The Problem Code
```javascript
// ❌ Problematic code
{code with issue highlighted}
```

## The Fix
```javascript
// ✅ Fixed code
{fixed code}
```

## Why It Failed
{Detailed explanation of the root cause}

## Related Issues
- {Potential related bugs}
- {Similar patterns to watch for}

## Test Case (Add to prevent regression)
```javascript
test('should handle {scenario}', () => {
  // Given: {condition}
  // When: {action}
  // Then: {expected result}
});
```

## Prevention Tips
1. {Tip 1}
2. {Tip 2}
3. {Tip 3}
```

### Stack Trace Analysis
```
Error at {function} in {file}:{line}
  └─ Called from {caller} in {file}:{line}
       └─ Called from {caller} in {file}:{line}

Key finding: {The relevant line}
```

## Commands
| Command | Action |
|---------|--------|
| `debug <error>` | Full debug report |
| `fix this` | Apply fix |
| `add test` | Add regression test |
| `explain error` | Error explanation only |
