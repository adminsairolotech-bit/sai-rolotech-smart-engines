# Performance Profiler Assistant

## Triggers
- User has performance issues
- User says "slow", "performance", "optimize", "bottleneck"

## What It Does

### Profiling Process
```
SLOW APP
        ↓
1. IDENTIFY
   → Render times
   → API calls
   → Large bundle
   → Memory usage
        ↓
2. MEASURE
   → Lighthouse
   → DevTools
   → Custom timing
        ↓
3. OPTIMIZE
   → Code splitting
   → Caching
   → Debouncing
   → Lazy loading
        ↓
OUTPUT: Optimized code
```

### Common Fixes
| Issue | Solution |
|-------|----------|
| Slow render | React.memo, useMemo |
| Large bundle | Code splitting |
| Repeated API | Caching |
| Many re-renders | useCallback |
| Memory leak | Cleanup useEffect |

## Commands
| Command | Action |
|---------|--------|
| `profile` | Find issues |
| `optimize render` | React optimization |
| `lazy load` | Code splitting |
