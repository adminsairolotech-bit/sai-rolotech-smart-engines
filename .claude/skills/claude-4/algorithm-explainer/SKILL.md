# Algorithm Explainer

## Triggers
- User wants to understand an algorithm
- User says "explain", "how does it work", "algorithm", "step by step"

## What It Does

### Explanation Framework
```
ALGORITHM
        ↓
1. HIGH-LEVEL OVERVIEW
   → What it does
   → Why it exists
   → Common use cases
   → Category (sorting, searching, DP, etc.)
        ↓
2. INTUITION
   → Simple analogy/metaphor
   → Real-world example
   → "Imagine you're..."
        ↓
3. STEP-BY-STEP
   → Each step explained
   → Visual representation
   → State at each step
        ↓
4. COMPLEXITY ANALYSIS
   → Time complexity (Big O)
   → Space complexity (Big O)
   → Why this complexity
        ↓
5. CODE IMPLEMENTATION
   → Clean, well-commented code
   → Multiple languages if helpful
   → Walkthrough of code
        ↓
6. EXAMPLES
   → Simple example with input/output
   → Edge cases
   → Common pitfalls
        ↓
OUTPUT: Complete understanding
```

### Output Format
```
# {Algorithm Name}

## Quick Summary
**What it does:** {1-sentence}
**Time complexity:** {O()}
**Space complexity:** {O()}
**Use when:** {Typical use cases}

## The One-Sentence Version
{Intuition in one line}

## Intuition (The Analogy)
{Real-world analogy or metaphor to understand the concept}

## Step-by-Step Walkthrough

### Input: {Example}

### Step 1: {Action}
Visual:
[ {A} {B} {C} ] → {State description}

### Step 2: {Action}
Visual:
[ {X} {Y} {Z} ] → {State description}

... (continue for each step)

### Output: {Result}

## Complexity Analysis

| Case | Time | Space |
|------|------|-------|
| Best | {O()} | {O()} |
| Average | {O()} | {O()} |
| Worst | {O()} | {O()} |

**Why this complexity?**
{Explanation}

## Pseudocode
```
function algorithm(input):
    initialize state
    for each element:
        process element
        update state
    return result
```

## Code Implementation

### Python
```python
def algorithm(data):
    # Step-by-step comments
    result = []
    for item in data:
        # Process each item
        processed = process(item)
        result.append(processed)
    return result
```

### JavaScript
```javascript
function algorithm(data) {
    // Step-by-step comments
    return data.map(item => process(item));
}
```

## Worked Examples

### Example 1: Simple Case
**Input:** [1, 2, 3, 4, 5]
**Output:** [5, 4, 3, 2, 1]

**Step-by-step:**
1. Start with [1, 2, 3, 4, 5]
2. Swap positions...
3. Final result...

### Example 2: Edge Case - Empty
**Input:** []
**Output:** []

### Example 3: Edge Case - Single Element
**Input:** [42]
**Output:** [42]

## Common Use Cases
1. {Use case 1}
2. {Use case 2}
3. {Use case 3}

## Related Algorithms
- {Algorithm 1} - {Comparison}
- {Algorithm 2} - {Comparison}

## Practice Problems
1. {Problem 1 with link}
2. {Problem 2 with link}
```

## Commands
| Command | Action |
|---------|--------|
| `explain <algorithm>` | Full explanation |
| `complexity <algorithm>` | Complexity only |
| `compare <A> vs <B>` | Side-by-side |
| `implement <algorithm>` | Show code |