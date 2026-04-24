# Dependency Upgrade Planner

## Triggers
- User wants to upgrade packages
- User says "upgrade", "update package", "breaking changes", "migrate"

## What It Does

### Upgrade Process
```
PACKAGE UPGRADE
        ↓
1. CHECK VERSIONS
   → Current version
   → Latest stable
   → Breaking changes
   → Migration guide
        ↓
2. PLAN CHANGES
   → Code changes needed
   → Test updates
   → Config changes
        ↓
3. EXECUTE
   → Update package.json
   → Run npm install
   → Fix breaking changes
   → Run tests
        ↓
OUTPUT: Migration plan
```

### Output Format
```markdown
# Upgrade: {package} {old} → {new}

## Breaking Changes
- `{oldAPI}` removed → Use `{newAPI}`
- `{config}` format changed → See migration

## Migration Steps

### Step 1: Update package.json
```bash
npm install {package}@{new}
```

### Step 2: Update Code
```typescript
// Before
import { oldAPI } from 'package';

// After
import { newAPI } from 'package';
```

### Step 3: Update Config
```json
// Before
{ "oldConfig": "value" }

// After
{ "newConfig": "value" }
```

### Step 4: Test
```bash
npm test
```

## Commands
| Command | Action |
|---------|--------|
| `upgrade <package>` | Plan upgrade |
| `check breaking` | Breaking changes |
| `migrate` | Execute migration |
