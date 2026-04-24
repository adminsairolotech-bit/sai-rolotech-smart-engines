# Commit Message Writer

## Triggers
- User wants commit messages
- User says "commit", "git message", "commit this"

## What It Does

### Commit Structure
```
CHANGES
        ↓
1. IDENTIFY TYPE
   → feat: New feature
   → fix: Bug fix
   → docs: Documentation
   → style: Formatting
   → refactor: Code restructure
   → test: Adding tests
   → chore: Maintenance
        ↓
2. WRITE MESSAGE
   → Subject (50 chars max)
   → Body (explain why)
   → Footer (issues/breaking)
        ↓
OUTPUT: Commit message
```

### Output Format
```
# Conventional Commits

## Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

## Examples

### Feature
```
feat(auth): add Google OAuth login

Users can now sign in with Google account.
Simplifies onboarding for new users.

Closes #123
```

### Bug Fix
```
fix(cart): prevent double-click on checkout

Added debounce to prevent multiple charges.
Server-side validation also added as backup.

Fixes #456
```

### Breaking Change
```
refactor(api)!: change response format

BREAKING: /api/users now returns { data: {...} }
instead of direct user object.

Migration: Update client code to handle new format.
```

## Commands
| Command | Action |
|---------|--------|
| `commit this` | Generate message |
| `conventional commit` | Standard format |
| `breaking commit` | With breaking change |
