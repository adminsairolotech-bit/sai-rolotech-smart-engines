# Changelog Generator

## Triggers
- User wants changelog/release notes
- User says "changelog", "release notes", "what changed", "history"

## What It Does

### Changelog Generation
```
COMMIT HISTORY
        ↓
1. PARSE COMMITS
   → Conventional commits
   → Breaking changes
   → Features/fixes/docs
        ↓
2. CATEGORIZE
   → Features ✨
   → Bug Fixes 🐛
   → Breaking Changes 💥
   → Documentation 📝
   → Performance ⚡
        ↓
3. FORMAT
   → Keep a changelog format
   → Semantic versioning
   → Links to PRs/commits
        ↓
OUTPUT: Changelog
```

### Output Format
```markdown
# Changelog

## [2.0.0] - 2024-01-15

### ✨ Features
- New dashboard design (#123)
- Export to PDF (#124)

### 🐛 Bug Fixes
- Fix login redirect loop (#125)
- Correct price display (#126)

### 💥 Breaking Changes
- `oldAPI()` removed → Use `newAPI()`
  Migration: See docs/MIGRATION.md

### 📝 Documentation
- Update README with new setup
- Add API reference

## [1.5.0] - 2024-01-01
...
```

## Commands
| Command | Action |
|---------|--------|
| `changelog` | Generate changelog |
| `since last` | Changes since release |
| `add entry` | Add manually |
