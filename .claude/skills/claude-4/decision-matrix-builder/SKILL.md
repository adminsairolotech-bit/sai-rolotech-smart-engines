# Decision Matrix Builder

## Triggers
- User wants to compare options and make decisions
- User says "compare", "decision", "pros cons", "score", "which one"

## What It Does

### Decision Framework
```
1. DEFINE OPTIONS
   → List all choices
   → Include baseline/do-nothing
   
2. IDENTIFY CRITERIA
   → What matters for this decision
   → Weight by importance
   
3. SCORE OPTIONS
   → Rate each option per criteria
   → Consider pros and cons
   
4. CALCULATE
   → Weighted score calculation
   → Sensitivity analysis
   
5. RECOMMEND
   → Best choice with reasoning
   → Risks and caveats
```

### Output Format
```
# Decision Matrix: {Topic}

## Options Considered
1. {Option A}
2. {Option B}
3. {Option C}
4. {Do nothing / Alternative}

## Criteria & Weights
| Criteria | Weight | Why it matters |
|----------|--------|----------------|
| {Criteria 1} | {X}% | {Reason} |
| {Criteria 2} | {X}% | {Reason} |
| {Criteria 3} | {X}% | {Reason} |
| {Criteria 4} | {X}% | {Reason} |

## Scoring (1-10 scale)

| Option | {Crit 1} | {Crit 2} | {Crit 3} | {Crit 4} | Weighted Score |
|--------|----------|----------|----------|----------|----------------|
| {A} | {X} | {X} | {X} | {X} | **{X}/10** |
| {B} | {X} | {X} | {X} | {X} | **{X}/10** |
| {C} | {X} | {X} | {X} | {X} | **{X}/10** |

## Pros & Cons

### Option A
**✓ Pros:**
- {Pro 1}
- {Pro 2}

**✗ Cons:**
- {Con 1}
- {Con 2}

### Option B
...

## Visualization
```
Scores:
{A}:  ████████████████░░  {X}/10
{B}:  ██████████░░░░░░░░░  {X}/10
{C}:  ████████████░░░░░░  {X}/10
```

## Recommendation

### 🏆 Winner: {Option A}
**Score:** {X}/10
**Why:** {Primary reason}

**Key strengths:**
- Strongest on: {Criteria where it scores highest}
- Best overall value

**Caveats:**
- {Any risks or concerns}

## Sensitivity Analysis
What if we change weights?
- If {Criteria 1} is most important → {Option X} wins
- If {Criteria 2} is most important → {Option Y} wins

## Next Steps
1. {Action 1}
2. {Action 2}
```

## Commands
| Command | Action |
|---------|--------|
| `decision matrix` | Full analysis |
| `pros cons` | Simple comparison |
| `sensitivity` | Weight analysis |
