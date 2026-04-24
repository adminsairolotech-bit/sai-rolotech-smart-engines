# Deep Research Assistant

## Triggers
- User wants comprehensive research on a topic
- User says "research", "deep dive", "find out", "investigate"

## What It Does

### Research Process
```
1. DEFINE SCOPE
   → What to research
   → Depth level (surface/medium/deep)
   → Time constraint

2. GATHER INFORMATION
   → Web search for latest info
   → Analyze sources for credibility
   → Extract key facts and data
   → Find supporting evidence

3. ORGANIZE FINDINGS
   → Group by theme/category
   → Identify patterns and insights
   → Note conflicting information
   → Flag knowledge gaps

4. SYNTHESIZE
   → Connect pieces into coherent picture
   → Draw conclusions
   → Identify implications
   → Suggest next steps
```

### Output Formats

#### Executive Summary (2-3 paragraphs)
```
Key Findings:
• Finding 1 with data source
• Finding 2 with data source  
• Finding 3 with data source

Implications:
- What this means
- What to do next

Sources: X articles, Y reports, Z expert opinions
```

#### Detailed Report
```
# {Topic} Research Report

## Executive Summary

## Key Findings
### 1. {Finding Title}
Evidence: {source}
Implications: {what this means}

### 2. {Finding Title}
...

## Supporting Details

## Gaps & Uncertainties

## Recommendations

## Sources

## Appendix: Raw Notes
```

### Source Tracking
```
Always cite sources:
- "[Source 1] - Study by XYZ in 2024"
- "[Source 2] - Government data"
- "[Source 3] - Industry report"

Include:
- Publication date
- Credibility assessment
- Key statistics
- Direct quotes if relevant
```

### Research Depth Levels
| Level | Time | Coverage |
|-------|------|----------|
| Surface | 5 min | Top results, common knowledge |
| Medium | 15 min | Multiple sources, analysis |
| Deep | 30+ min | Comprehensive, expert opinions, raw data |

## Commands
| Command | Action |
|---------|--------|
| `research <topic>` | Start research |
| `research <topic> deep` | Comprehensive research |
| `summarize research` | Show key findings only |
| `sources` | Show all sources used |