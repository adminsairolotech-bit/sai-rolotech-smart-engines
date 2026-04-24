# Logging Policy (no secrets, actionable errors)

## Goals

- Logs must help debug failures **without leaking secrets/PII**.
- User-facing UI must show **visible, actionable errors** (no silent catch).
- Prefer **structured logs** over ad-hoc `console.log` noise.

## Never log (hard ban)

- Passwords, reset tokens, session cookies, JWTs, CSRF tokens
- API keys / PATs / OAuth client secrets
- Full authorization headers, full cookies
- Raw uploaded files (DXF, ZIP) or their full contents
- Production database connection strings

## What to log (recommended)

- **Event name** + **timestamp** + **request id/correlation id**
- **High-level outcome**: success/failure + error class/category
- **Safe context**:
  - route/handler name
  - file size (bytes), content-type, generated safe filename (not user filename)
  - counts (entities parsed, stations generated), timings
- **Security events**:
  - rate-limit triggers
  - repeated failed logins (without identifying whether account exists)
  - upload rejects (size/type/parse limit) without file contents

## Error handling rules

- Do not swallow exceptions. If you catch:
  - log a **sanitized** summary (no secrets)
  - return a safe error response and show a clear UI error state
- For auth:
  - login errors must be generic (“Invalid credentials”)
  - forgot-password must always say “If account exists…”

## Console usage (frontend)

- Avoid `console.log` in production paths.
- Allowed: `console.warn`/`console.error` for unexpected failures, with sanitized payloads.

## Backend logging (Node/Python)

- Prefer a logger that supports levels + JSON output (example: pino / winston in Node; structlog / logging JSON in Python).
- Include a request id (header or generated) and propagate it across calls.

## Redaction

- If logging request/response metadata, **redact**:
  - `authorization`, `cookie`, `set-cookie`
  - `password`, `token`, `secret`, `apiKey`, `csrf`

## Review gate

Any change that adds new logging in auth/upload/export paths must be reviewed with:
- “Could this leak secrets/PII?”
- “Is the user-visible error state clear and truthful?”

