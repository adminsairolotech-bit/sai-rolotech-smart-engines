# Data Analysis Reasoner

## Triggers
- User shares data for analysis
- User says "analyze this", "data", "numbers", "insights", "trends"

## What It Does

### Analysis Process
```
DATA (CSV, Table, Numbers)
        ↓
1. DATA PROFILING
   → Data types and formats
   → Missing values
   → Duplicate rows
   → Basic statistics (mean, median, mode, std dev)
   → Range and distribution
        ↓
2. EXPLORATORY ANALYSIS
   → Single variable analysis
   → Multi-variable correlations
   → Group comparisons
   → Time series patterns (if temporal)
        ↓
3. ANOMALY DETECTION
   → Outliers
   → Unusual patterns
   → Data quality issues
   → Statistical anomalies
        ↓
4. PATTERN RECOGNITION
   → Trends (increasing/decreasing)
   → Seasonality
   → Clusters
   → Correlations
   → Associations
        ↓
5. INSIGHTS GENERATION
   → Key findings
   → Business implications
   → Actionable recommendations
   → "So what?" for each insight
        ↓
OUTPUT: Analysis report with insights
```

### Output Format
```
# Data Analysis Report

## Data Overview
**Rows:** {X}
**Columns:** {Y}
**Date range:** {If temporal}
**Last updated:** {Date}

### Column Summary
| Column | Type | Non-Null | Sample |
|--------|------|----------|--------|
| col1 | string | 100% | abc |
| col2 | number | 98% | 123 |

### Data Quality
✓ Completeness: {X}%
✓ Duplicates: {X} rows
⚠️ Missing values: {Column} ({X}% missing)
⚠️ Outliers: {Column} ({X} detected)

## Statistical Summary

### Numerical Columns
| Column | Mean | Median | Std Dev | Min | Max |
|--------|------|--------|---------|-----|-----|
| col1 | {X} | {X} | {X} | {X} | {X} |

### Categorical Columns
| Column | Unique Values | Top 3 |
|--------|--------------|-------|
| col1 | 15 | A (30%), B (25%), C (20%) |

## Key Findings

### 🔍 Finding 1: {Insight Title}
**What:** {Description of the finding}
**Data:** {Supporting numbers}
**Confidence:** High/Medium/Low

**Why it matters:** {Business impact}

**Recommendation:** {What to do about it}

### 🔍 Finding 2: {...}

## Trends & Patterns

### Time Series (if applicable)
```
{Month} | {Metric} | Trend
───────┼──────────┼───────
Jan    | 100      | ─────
Feb    | 115      | ↗ (+15%)
Mar    | 108      | ↘ (-7%)
Apr    | 130      | ↗ (+20%)
```

### Correlations
| Variable A | Variable B | Correlation | Meaning |
|------------|------------|-------------|---------|
| X | Y | +0.85 | Strong positive |
| X | Z | -0.42 | Moderate negative |

## Anomalies Detected

### Outliers
| Column | Value | Expected Range | Severity |
|--------|-------|----------------|----------|
| revenue | 1,00,000 | 1,000-10,000 | High |

### Unusual Patterns
- {Description of anomaly 1}
- {Description of anomaly 2}

## Charts (Visualizations)
{Create ASCII/text-based visualizations or suggest charts}

### Suggested Visualizations
1. **Bar Chart:** {What to show}
2. **Line Chart:** {What to show over time}
3. **Scatter Plot:** {Correlation between X and Y}

## Recommendations

### Immediate Actions
1. {Action 1}
2. {Action 2}

### Questions to Investigate
1. {Question 1}
2. {Question 2}

### Opportunities
1. {Opportunity 1}
2. {Opportunity 2}

## Appendix: Raw Numbers

### All Statistics
{Complete statistical output}
```

## Commands
| Command | Action |
|---------|--------|
| `analyze <data>` | Full analysis |
| `summary` | Quick summary |
| `find outliers` | Anomaly detection |
| `correlations` | Correlation analysis |
| `trends` | Time series analysis |
| `compare groups` | Group comparison |