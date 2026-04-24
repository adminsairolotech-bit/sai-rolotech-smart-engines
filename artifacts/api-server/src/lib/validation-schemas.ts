import { z } from "zod";

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// Material types supported by the system
export const MaterialTypeSchema = z.enum([
  "MS", "GI", "CR", "HR", "SS", "AL", "CU", "TI", "PP", "HSLA"
]);

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ============================================================================
// DXF UPLOAD SCHEMAS
// ============================================================================

// File size limit: 50MB max
const MAX_DXF_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types for DXF files
const ALLOWED_MIME_TYPES = [
  "image/vnd.dxf",
  "application/dxf",
  "application/x-dxf",
  "drawing/x-dxf",
  "image/x-dxf",
  "text/plain", // Some DXF files are plain text
];

export const DxfUploadSchema = z.object({
  dimensions: z.object({
    stripWidth: z.number().positive("Strip width must be positive"),
    thickness: z.number().min(0.1).max(20, "Thickness must be between 0.1 and 20 mm"),
  }).optional(),
});

export const DxfValidationSchema = z.object({
  fileSize: z.number().max(MAX_DXF_FILE_SIZE, `File size exceeds ${MAX_DXF_FILE_SIZE / 1024 / 1024}MB limit`),
  mimeType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid file type. Only DXF files are allowed." }),
  }),
});

// ============================================================================
// GEOMETRY SCHEMAS
// ============================================================================

export const BendPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  angle: z.number(),
});

export const GeometrySchema = z.object({
  segments: z.array(z.any()),
  bendPoints: z.array(BendPointSchema),
  boundingBox: z.object({
    minX: z.number(),
    minY: z.number(),
    maxX: z.number(),
    maxY: z.number(),
  }),
  totalLength: z.number().positive(),
});

export const NormalizeGeometrySchema = z.object({
  geometry: GeometrySchema,
  options: z.object({
    flipY: z.boolean().optional(),
    centerAtOrigin: z.boolean().optional(),
    scale: z.number().positive().optional(),
  }).optional(),
});

// ============================================================================
// FLOWER PATTERN SCHEMAS
// ============================================================================

export const FlowerInputSchema = z.object({
  geometry: GeometrySchema,
  numStations: z.number().int().min(1).max(50),
  stationPrefix: z.string().default("ST"),
  materialType: MaterialTypeSchema,
  thickness: z.number().min(0.1).max(20),
  openSectionType: z.enum(["C", "U", "Z", "Sigma", "Custom"]).default("C"),
});

export const FlowerOutputSchema = z.object({
  stations: z.array(z.object({
    id: z.string(),
    angle: z.number(),
    upperRoller: z.object({
      diameter: z.number(),
      gap: z.number(),
      angle: z.number(),
    }),
    lowerRoller: z.object({
      diameter: z.number(),
      gap: z.number(),
      angle: z.number(),
    }),
    status: z.enum(["Complete", "Incomplete", "NoProfile", "Blocked"]),
  })),
  formingForce: z.number(),
  neutralAxisStripWidth: z.number(),
});

// ============================================================================
// ROLL TOOLING SCHEMAS
// ============================================================================

export const RollToolingInputSchema = z.object({
  geometry: GeometrySchema,
  numStations: z.number().int().min(1).max(50),
  stationPrefix: z.string().default("ST"),
  materialThickness: z.number().min(0.1).max(20),
  rollDiameter: z.number().positive(),
  shaftDiameter: z.number().positive(),
  clearance: z.number().min(0).max(10),
  materialType: MaterialTypeSchema,
  postProcessorId: z.string().default("delta_2x"),
  openSectionType: z.enum(["C", "U", "Z", "Sigma", "Custom"]).default("C"),
});

export const RollToolingOutputSchema = z.object({
  rolls: z.array(z.object({
    stationId: z.string(),
    upperRoll: z.object({
      diameter: z.number(),
      bore: z.number(),
      width: z.number(),
      material: z.string(),
    }),
    lowerRoll: z.object({
      diameter: z.number(),
      bore: z.number(),
      width: z.number(),
      material: z.string(),
    }),
    shaft: z.object({
      diameter: z.number(),
      length: z.number(),
    }),
  })),
  billOfMaterials: z.array(z.any()),
});

// ============================================================================
// GCODE SCHEMAS
// ============================================================================

export const GcodeInputSchema = z.object({
  geometry: GeometrySchema,
  numStations: z.number().int().min(1).max(50),
  stationPrefix: z.string().default("ST"),
  gcodeConfig: z.object({
    rapidFeed: z.number().positive().optional(),
    workingFeed: z.number().positive().optional(),
    safetyHeight: z.number().positive().optional(),
    toolChangePosition: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }).optional(),
  }),
  machineProfile: z.object({
    controllerType: z.string(),
    travelLimits: z.object({
      x: z.object({ min: z.number(), max: z.number() }),
      y: z.object({ min: z.number(), max: z.number() }),
      z: z.object({ min: z.number(), max: z.number() }),
    }),
  }).optional(),
});

export const GcodeOutputSchema = z.object({
  outputs: z.array(z.object({
    stationId: z.string(),
    code: z.string(),
    filename: z.string(),
  })),
  totalLines: z.number(),
  estimatedTime: z.number(), // in seconds
});

// ============================================================================
// SIMULATION SCHEMAS
// ============================================================================

export const SimulationInputSchema = z.object({
  geometry: GeometrySchema,
  rollGeometry: z.any(), // Roll geometry from tooling
  materialType: MaterialTypeSchema,
  thickness: z.number().min(0.1).max(20),
  numStations: z.number().int().min(1).max(50),
  rollDiameter: z.number().positive(),
  shaftDiameter: z.number().positive(),
  lineSpeed: z.number().min(0).max(200), // m/min
  simulationConfig: z.object({
    meshSize: z.number().positive().optional(),
    iterations: z.number().int().positive().optional(),
    tolerance: z.number().positive().optional(),
  }).optional(),
});

export const SimulationOutputSchema = z.object({
  springbackPerBend: z.array(z.object({
    bendIndex: z.number(),
    angle: z.number(),
    springback: z.number(),
    compensation: z.number(),
  })),
  deflectionAnalysis: z.array(z.any()),
  formingPowerEstimate: z.number(),
  warnings: z.array(z.string()),
});

// ============================================================================
// MATERIAL SCHEMAS
// ============================================================================

export const MaterialSchema = z.object({
  type: MaterialTypeSchema,
  grade: z.string().optional(),
  yieldStrength: z.number().positive(), // MPa
  tensileStrength: z.number().positive(), // MPa
  elongation: z.number().min(0).max(100), // %
  kFactor: z.number().min(0).max(1),
  surfaceFinish: z.string(),
  density: z.number().positive(), // g/cm³
});

// ============================================================================
// PROJECT/FOLDER SCHEMAS
// ============================================================================

export const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

export const ProjectUpdateSchema = ProjectSchema.partial();

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const ExportFormatSchema = z.enum(["DXF", "CSV", "XML", "ZIP", "PDF"]);
export const ExportResolutionSchema = z.enum(["LOW", "MEDIUM", "HIGH", "VECTOR"]);

export const ExportRequestSchema = z.object({
  format: ExportFormatSchema,
  geometry: GeometrySchema,
  includeBom: z.boolean().default(true),
  includeDrawings: z.boolean().default(true),
  resolution: ExportResolutionSchema.default("MEDIUM"),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
  timestamp: z.string().datetime(),
});

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate file before processing
 */
export function validateDxfFile(file: { size: number; mimetype: string }):
  { valid: true } | { valid: false; error: string } {
  const result = DxfValidationSchema.safeParse({
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors.map(e => e.message).join(", ")
    };
  }

  return { valid: true };
}

/**
 * Sanitize string input to prevent injection
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"\'`]/g, "") // Remove potentially dangerous chars
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate number is within safe range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): { valid: true } | { valid: false; error: string } {
  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return { valid: true };
}
