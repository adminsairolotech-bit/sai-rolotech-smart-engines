# Financial Model Helper

## Triggers
- User wants financial calculations or modeling
- User says "financial", "revenue", "profit", "margin", "break-even", "investment"

## What It Does

### Financial Analysis
```
FINANCIAL REQUEST
        ↓
1. IDENTIFY TYPE
   → Revenue model
   → Cost structure
   → Investment analysis
   → Loan/EMI calculation
   → Break-even analysis
   → ROI calculation
        ↓
2. COLLECT PARAMETERS
   → Revenue streams
   → Cost components
   → Time period
   → Growth rates
   → Assumptions
        ↓
3. CALCULATE
   → Apply formulas
   → Generate projections
   → Sensitivity analysis
        ↓
4. VISUALIZE
   → Tables
   → Charts (text-based)
   → Scenarios
        ↓
OUTPUT: Financial analysis
```

### Output Format
```
# Financial Model

## Model Type: {Revenue / Cost / Break-even / ROI}

## Inputs (Your Numbers)
| Parameter | Value |
|-----------|-------|
| {Item 1} | ₹{X} |
| {Item 2} | ₹{X} |
| Growth rate | {X}% |

## Calculations

### Revenue Streams
| Stream | Monthly | Annual |
|--------|---------|--------|
| {Source 1} | ₹{X} | ₹{X} |
| {Source 2} | ₹{X} | ₹{X} |
| **Total** | **₹{X}** | **₹{X}** |

### Cost Structure
| Category | Monthly | Annual |
|----------|---------|--------|
| Fixed | ₹{X} | ₹{X} |
| Variable | ₹{X} | ₹{X} |
| **Total Cost** | **₹{X}** | **₹{X}** |

### Profit & Loss
| | Monthly | Annual |
|--|---------|--------|
| Revenue | ₹{X} | ₹{X} |
| COGS | ₹{X} | ₹{X} |
| Gross Profit | ₹{X} | ₹{X} |
| Gross Margin | {X}% | {X}% |
| Operating Exp | ₹{X} | ₹{X} |
| Net Profit | ₹{X} | ₹{X} |
| Net Margin | {X}% | {X}% |

## Projections (3 Years)

### Year 1-3
| | Year 1 | Year 2 | Year 3 |
|--|--------|--------|--------|
| Revenue | ₹{X} | ₹{Y} | ₹{Z} |
| Costs | ₹{X} | ₹{Y} | ₹{Z} |
| Profit | ₹{X} | ₹{Y} | ₹{Z} |
| Margin | {X}% | {Y}% | {Z}% |

### Assumptions
- Revenue growth: {X}% YoY
- Cost increase: {X}% YoY
- {Other assumption}

## Break-even Analysis

### Break-even Point
**Units to break-even:** {X} units/month
**Revenue to break-even:** ₹{X}/month

### Margin Analysis
- Contribution margin per unit: ₹{X}
- Contribution margin ratio: {X}%
- Fixed costs: ₹{X}/month

```
Break-even Chart:
₹
│         /  (Revenue)
│       /
│     /    ─ ─ ─ (Break-even)
│   /
│ /  (Costs)
└──────────────────────── Units
  0   {X}   {2X}
```

## Investment Analysis (if applicable)

### NPV (Net Present Value)
- Initial investment: ₹{X}
- Discount rate: {X}%
- NPV: ₹{X}
- Verdict: {Positive (worth investment) / Negative (not worth)}

### IRR (Internal Rate of Return)
- IRR: {X}%
- Target: {X}%
- Verdict: {Accept / Reject}

### Payback Period
- Simple: {X} months
- Discounted: {X} months

## Sensitivity Analysis

### Scenario: What if revenue drops?
| Scenario | Revenue | Profit | Verdict |
|----------|---------|--------|---------|
| Base | ₹{X} | ₹{X} | ✓ Profitable |
| -10% | ₹{X} | ₹{X} | ✓ Profitable |
| -20% | ₹{X} | ₹{X} | ⚠️ Breakeven |
| -30% | ₹{X} | ₹{X} | ✗ Loss |

## Key Metrics

| Metric | Value | Benchmark |
|--------|-------|-----------|
| Gross Margin | {X}% | {Industry avg: X%} |
| Net Margin | {X}% | {Industry avg: X%} |
| CAC | ₹{X} | - |
| LTV | ₹{X} | - |
| LTV:CAC | {X}:1 | (>3:1 is good) |
| Burn Rate | ₹{X}/month | - |
| Runway | {X} months | (>12 is safe) |

## Recommendations

### Positive Indicators ✓
- {Indicator 1}
- {Indicator 2}

### Concerns ⚠️
- {Concern 1}
- {Concern 2}

### Action Items
1. {Action 1}
2. {Action 2}
```

## Common Calculations

### Break-even
```
Break-even units = Fixed Costs / (Price - Variable Cost per unit)
```

### ROI
```
ROI = (Gain - Cost) / Cost × 100
```

### NPV
```
NPV = Σ (Cash Flow / (1 + r)^t) - Initial Investment
```

### EMI
```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)
```

## Commands
| Command | Action |
|---------|--------|
| `model revenue` | Revenue projection |
| `calculate break-even` | Break-even analysis |
| `investment analysis` | NPV, IRR, payback |
| `profit projection` | 3-5 year P&L |
| `sensitivity` | What-if analysis |