# Security Audit Skill

## Triggers
- User wants security review
- User says "security", "audit", "vulnerability", "secrets", "scan"

## What It Does

### Audit Checklist
```
AUTHENTICATION:
□ Weak passwords allowed
□ Session management issues
□ Token exposure

AUTHORIZATION:
□ Broken access control
□ Privilege escalation
□ IDOR vulnerabilities

DATA:
□ SQL injection
□ XSS vulnerabilities
□ Sensitive data exposure

SECRETS:
□ API keys in code
□ Passwords in git
□ Secrets in env

CRYPTO:
□ Weak encryption
□ Hardcoded secrets
□ Insecure random
```

### Output Format
```
# Security Audit Report

## Overall Risk: 🟡 MEDIUM

## 🚨 Critical Issues

### 1. API Key Exposed 🔴
**File:** `src/config.ts:15`
**Issue:** API key hardcoded
**Fix:** Use environment variable

```bash
# Before
const API_KEY = 'sk-abc123...';

# After
const API_KEY = process.env.API_KEY;
```

## ⚠️ Medium Issues
- SQL injection risk in `db.ts`
- XSS potential in `renderUserInput()`

## ✅ Secure
- Password hashing ✓
- HTTPS enforced ✓
- CSRF tokens ✓
```

## Commands
| Command | Action |
|---------|--------|
| `security audit` | Full audit |
| `scan secrets` | Check for secrets |
| `fix vulnerability` | Fix specific issue |
