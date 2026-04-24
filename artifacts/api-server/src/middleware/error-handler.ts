import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

const logWarn = (message: string, details?: unknown): void => {
  console.warn(message, details);
};

const logError = (message: string, details?: unknown): void => {
  console.error(message, details);
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(429, message, "RATE_LIMITED");
    this.name = "TooManyRequestsError";
  }
}

// ============================================================================
// ERROR RESPONSE FORMATTER
// ============================================================================

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Format error for consistent API response
 */
function formatErrorResponse(
  error: Error,
  statusCode: number,
  requestId?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: error.message || "Internal server error",
      code: error instanceof AppError ? error.code || "ERROR" : "INTERNAL_ERROR",
      details: error instanceof AppError ? error.details : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  if (requestId) {
    response.requestId = requestId;
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === "production" && !(error instanceof AppError)) {
    response.error.message = "Internal server error";
  }

  return response;
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

/**
 * Global error handler middleware
 * MUST be the last middleware in the chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers["x-request-id"] as string;

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    logError(`[${err.statusCode}] ${err.code}: ${err.message}`, {
      path: req.path,
      method: req.method,
      requestId,
    });

    res.status(err.statusCode).json(formatErrorResponse(err, err.statusCode, requestId));
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    logWarn(`[400] VALIDATION_ERROR: ${err.errors.length} validation errors`, {
      path: req.path,
      method: req.method,
      errors: details,
    });

    const validationError = new ValidationError(
      "Validation failed",
      details
    );

    res.status(400).json(formatErrorResponse(validationError, 400, requestId));
    return;
  }

  // Handle SyntaxError (JSON parsing)
  if (err instanceof SyntaxError && "body" in err) {
    logWarn(`[400] JSON_SYNTAX_ERROR`, {
      path: req.path,
      method: req.method,
    });

    res.status(400).json(
      formatErrorResponse(
        new ValidationError("Invalid JSON in request body"),
        400,
        requestId
      )
    );
    return;
  }

  // Handle unknown errors
  logError(`[500] INTERNAL_ERROR: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    requestId,
  });

  res.status(500).json(
    formatErrorResponse(
      new Error("Internal server error"),
      500,
      requestId
    )
  );
}

// ============================================================================
// ASYNC HANDLER WRAPPER
// ============================================================================

/**
 * Wrapper to catch errors in async route handlers
 * Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// NOT FOUND HANDLER
// ============================================================================

/**
 * 404 handler for undefined routes
 * Place AFTER all routes but BEFORE error handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: "ROUTE_NOT_FOUND",
    },
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// VALIDATION WRAPPER
// ============================================================================

/**
 * Validate request body/params/query with Zod schema
 * Usage: router.post("/", validate(LoginSchema), asyncHandler(async (req, res) => { ... }))
 */
export function validate<T>(
  schema: {
    safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: ZodError };
  }
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error;
      const details = zodError.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      logWarn(`[400] VALIDATION_ERROR: Request validation failed`, {
        path: req.path,
        errors: details,
      });

      throw new ValidationError("Validation failed", details);
    }

    // Replace body with validated data
    req.body = result.data;
    next();
  };
}

// ============================================================================
// PREDEFINED VALIDATORS
// ============================================================================

import { validateDxfFile, sanitizeString } from "../lib/validation-schemas";

/**
 * Validate uploaded file
 */
export function validateUpload(
  file: Express.Multer.File | undefined,
  options?: { maxSize?: number; allowedTypes?: string[] }
): void {
  if (!file) {
    throw new ValidationError("No file uploaded");
  }

  const maxSize = options?.maxSize || 50 * 1024 * 1024; // 50MB default
  const allowedTypes = options?.allowedTypes || [
    "image/vnd.dxf",
    "application/dxf",
    "text/plain",
  ];

  if (file.size > maxSize) {
    throw new ValidationError(
      `File size exceeds ${maxSize / 1024 / 1024}MB limit`
    );
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(
      `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
    );
  }
}

/**
 * Sanitize all string inputs in request body
 */
export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}
