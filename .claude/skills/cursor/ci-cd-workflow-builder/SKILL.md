# CI/CD Workflow Builder

## Triggers
- User wants CI/CD pipeline
- User says "CI/CD", "GitHub Actions", "pipeline", "automate deploy"

## What It Does

### Pipeline Stages
```
PUSH → TEST → BUILD → DEPLOY

1. TEST
   - Unit tests
   - Integration tests
   - Lint
   
2. BUILD
   - Compile/bundle
   - Security scan
   - Build image
   
3. DEPLOY
   - Staging deploy
   - Smoke tests
   - Production deploy
```

### Output Format
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - run: npm run deploy
```

## Commands
| Command | Action |
|---------|--------|
| `setup ci` | GitHub Actions |
| `add test` | Test stage |
| `add deploy` | Deploy stage |
