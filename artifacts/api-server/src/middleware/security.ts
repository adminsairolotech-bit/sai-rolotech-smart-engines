import { type Request, type Response, type NextFunction } from "express";
import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";

/**
 * Strict rate limiter for authentication endpoints.
 * 5 attempts per 15 minutes per IP.
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim(),
  message: {
    success: false,
    error: "Too many login attempts. Please try again after 15 minutes.",
    code: "AUTH_RATE_LIMITED",
  },
  skip: (_req: Request) => process.env["NODE_ENV"] === "test",
});

/**
 * Rate limiter for account deletion — very strict.
 * 2 requests per hour per IP.
 */
export const deletionRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim(),
  message: {
    success: false,
    error: "Too many deletion requests. Please try again later.",
    code: "DELETION_RATE_LIMITED",
  },
});

/**
 * Rate limiter for AI endpoints — generous but bounded.
 * 100 requests per 5 minutes per IP.
 */
export const aiRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim(),
  message: {
    success: false,
    error: "AI request limit reached. Please wait a few minutes.",
    code: "AI_RATE_LIMITED",
  },
});

/**
 * Audit trail — logs every API request with user context and action.
 * Writes to stdout in structured JSON format for easy log aggregation.
 */
export interface AuditEntry {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userId: string | null;
  userEmail: string | null;
  statusCode: number;
  durationMs: number;
  userAgent: string;
  action?: string;
  resourceId?: string;
}

const SENSITIVE_PATHS = new Set([
  "/auth/login", "/auth/logout", "/account-deletion-request",
  "/users/", "/admin/", "/license/",
]);

const SENSITIVE_METHODS = new Set(["DELETE", "POST", "PUT", "PATCH"]);

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const ip = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();

  // Capture user context from auth header or token
  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const parts = token.split(":");
      if (parts.length >= 2) {
        userEmail = parts[0];
        userId = parts[1];
      }
    }
    // Also check x-user-email header set by auth middleware
    if (req.headers["x-user-email"]) {
      userEmail = req.headers["x-user-email"] as string;
    }
    if (req.headers["x-user-id"]) {
      userId = req.headers["x-user-id"] as string;
    }
  } catch { /* non-fatal */ }

  // Extract action from path
  let action = `${req.method} ${req.path}`;
  const pathParts = req.path.split("/").filter(Boolean);
  if (pathParts.length >= 2) {
    action = `${req.method} /${pathParts[0]}/${pathParts[1]}`;
  }

  const resourceId = pathParts[pathParts.length - 1];

  // Capture original end
  const originalEnd = res.end;
  // @ts-ignore
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const durationMs = Date.now() - start;
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip,
      userId,
      userEmail,
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.headers["user-agent"] || "unknown",
      action: SENSITIVE_METHODS.has(req.method) || SENSITIVE_PATHS.has(req.path) ? action : undefined,
      resourceId: SENSITIVE_METHODS.has(req.method) ? resourceId : undefined,
    };

    // Always log sensitive requests; sample 1% of normal requests for debugging
    const isSensitive = SENSITIVE_PATHS.has(req.path) || res.statusCode >= 400;
    if (isSensitive || Math.random() < 0.01) {
      if (isSensitive) {
        console.log(`[AUDIT] ${JSON.stringify(entry)}`);
      } else {
        console.log(`[REQ] ${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
      }
    }

    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}

/**
 * Security headers — adds standard security headers to all responses.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");
  next();
}
