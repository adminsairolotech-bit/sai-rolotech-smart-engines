# Business Strategy Analyst

## Triggers
- User wants business/strategy analysis
- User says "strategy", "business plan", "market analysis", "competitor"

## What It Does

### Analysis Framework
```
INPUT: Business idea, company, market, or decision
       ↓
1. UNDERSTAND CONTEXT
   → Business model explained
   → Market position
   → Target customers
   → Revenue model
   → Current challenges
       ↓
2. MARKET ANALYSIS
   → Total addressable market (TAM)
   → Serviceable available market (SAM)
   → Growth rate and trends
   → Key drivers and barriers
       ↓
3. COMPETITIVE LANDSCAPE
   → Direct competitors (5-10)
   → Indirect competitors
   → SWOT analysis
   → Competitive moat assessment
       ↓
4. FINANCIAL MODELING
   → Revenue projections (3-5 years)
   → Cost structure
   → Break-even analysis
   → Key assumptions
       ↓
5. RISK ASSESSMENT
   → Market risks
   → Operational risks
   → Financial risks
   → Mitigation strategies
       ↓
OUTPUT: Strategic recommendation
```

### Output Format
```
# Business Strategy Analysis

## Executive Summary
**Business:** {Name/Concept}
**Market Size:** ₹{X} Crores
**Opportunity:** {Why now}
**Recommendation:** {Go/No-Go/Modify}

## Market Analysis

### Industry Overview
- Market Size: {TAM}
- Growth Rate: {X}% CAGR
- Key Trends: {1, 2, 3}

### Target Customer
- Demographics: {Who}
- Pain Points: {What problem}
- Willingness to Pay: {Range}
- Buying Behavior: {How they buy}

## Competitive Analysis

| Competitor | Strength | Weakness | Price | Market Share |
|------------|----------|----------|-------|--------------|
| {Name} | {Strength} | {Weak} | {₹X} | {X}% |
| ... | | | | |

### Competitive Advantages
✓ Your moat: {What protects you}
✓ Differentiator: {Why choose you}
⚠️ Vulnerable where: {Risk area}

## Financial Projections

### Revenue Model
- Primary: {Revenue stream}
- Secondary: {Revenue stream}
- Average order value: {₹X}
- Customer acquisition cost: {₹X}

### 3-Year Projection
| Year | Revenue | Costs | Profit |
|------|---------|-------|--------|
| Y1 | ₹{X} | ₹{Y} | ₹{Z} |
| Y2 | ₹{X} | ₹{Y} | ₹{Z} |
| Y3 | ₹{X} | ₹{Y} | ₹{Z} |

### Break-even: Month {X}

## Go-to-Market Strategy

### Phase 1 (0-3 months)
- Target: {Customer segment}
- Channels: {How to reach}
- Budget: ₹{X}

### Phase 2 (3-6 months)
- Scale: {What to scale}
- Metrics: {KPIs to track}

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk} | High/Med/Low | High/Med/Low | {Strategy} |

## Strategic Recommendation

### If GO:
- First 90 days: {Action plan}
- Key metrics to track: {KPIs}
- Quick wins: {Opportunities}

### If MODIFY:
- Key changes needed: {List}
- Concerns to address: {Issues}

### If NO-GO:
- Why: {Reasons}
- Alternative suggestions: {Options}
```

## Commands
| Command | Action |
|---------|--------|
| `analyze market` | Market sizing |
| `competitor analysis` | Competitive landscape |
| `financial model` | Revenue/cost projections |
| `go-to-market` | Launch strategy |
| `risk assessment` | Risk analysis |
| `strategy recommendation` | Full analysis + advice |