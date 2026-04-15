/**
 * SAI ROLO TECH - Shared TypeScript Configuration
 * TypeScript shared config for station calculations and material properties
 * Must match Python and Node.js constants exactly
 */

export interface StationLimits {
  MIN: number;
  MAX: number;
  RECOMMENDED_MAX: number;
}

export const STATION_LIMITS: StationLimits = {
  MIN: 4,
  MAX: 30,
  RECOMMENDED_MAX: 24,
};

export const MAX_ANGLE_DEG = 90;

export const K_FACTORS: Record<string, number> = {
  GI: 0.44,   // Galvanized Iron
  CR: 0.44,   // Cold Rolled
  HR: 0.42,   // Hot Rolled
  SS: 0.50,   // Stainless Steel
  AL: 0.43,   // Aluminum
  HSLA: 0.45, // High Strength Low Alloy
};

export const SPRINGBACK_DEG: Record<string, number> = {
  GI: 1.5,
  CR: 1.5,
  HR: 2.0,
  SS: 2.5,
  AL: 1.0,
  HSLA: 2.0,
};

export const YIELD_STRENGTH_MPA: Record<string, number> = {
  GI: 250,
  CR: 280,
  HR: 220,
  SS: 300,
  AL: 100,
  HSLA: 400,
};

export const PROFILE_TYPES = ['C-Channel', 'Z-Purlin', 'U-Channel', 'Lipped C', 'Shutter', 'Rack', 'Door Frame', 'Window'] as const;

export const MATERIALS = ['GI', 'CR', 'HR', 'SS', 'AL', 'HSLA'] as const;

export const ROLL_TYPES = ['GUIDE', 'BREAKDOWN', 'FORMING', 'GROOVE', 'FINPASS', 'SIZING'] as const;

export const ROLL_FORMING_STANDARDS = ['DIN 6935', 'VDI 3389', 'COPRA RF'] as const;

export const THICKNESS_BANDS = {
  THIN: { min: 0, max: 0.8, label: 'thin' },
  STANDARD: { min: 0.8, max: 1.2, label: 'standard' },
  MEDIUM_HEAVY: { min: 1.2, max: 2.0, label: 'medium_heavy' },
  HEAVY: { min: 2.0, max: Infinity, label: 'heavy' },
};

/**
 * Classify thickness into band
 * @param thickness - material thickness in mm
 * @returns band name
 */
export function thicknessBand(thickness: number): string {
  if (thickness < 0.8) return THICKNESS_BANDS.THIN.label;
  if (thickness <= 1.2) return THICKNESS_BANDS.STANDARD.label;
  if (thickness <= 2.0) return THICKNESS_BANDS.MEDIUM_HEAVY.label;
  return THICKNESS_BANDS.HEAVY.label;
}

/**
 * Get max angle per pass based on material and thickness
 * Matches Python: max_angle_per_pass()
 * @param material - material type
 * @param thickness - thickness in mm
 * @returns max angle in degrees
 */
export function maxAnglePerPass(material: string, thickness: number): number {
  const band = thicknessBand(thickness);
  const baseAngles: Record<string, Record<string, number>> = {
    thin: { GI: 25, CR: 25, HR: 20, SS: 15, AL: 30, HSLA: 20 },
    standard: { GI: 22, CR: 22, HR: 18, SS: 12, AL: 28, HSLA: 18 },
    medium_heavy: { GI: 18, CR: 18, HR: 15, SS: 10, AL: 25, HSLA: 15 },
    heavy: { GI: 15, CR: 15, HR: 12, SS: 8, AL: 20, HSLA: 12 },
  };
  return baseAngles[band]?.[material] ?? 15;
}

/**
 * Calculate passes per bend using COPRA standard formula
 * Matches Python: max(2, ceil(90/maxAngle))
 * @param maxAngle - maximum angle per pass in degrees
 * @returns minimum passes (minimum 2)
 */
export function passesPerBend(maxAngle: number): number {
  return Math.max(2, Math.ceil(90 / maxAngle));
}

/**
 * Calculate total stations for a profile
 * @param bends - number of bends in profile
 * @param maxAngle - max angle per pass
 * @param profileType - type of profile (for extra passes)
 * @returns total stations needed
 */
export function calculateStations(bends: number, maxAngle: number, profileType?: string): number {
  const ppb = passesPerBend(maxAngle);
  let total = bends * ppb;

  // Add section-specific extra passes
  const sectionExtra: Record<string, number> = {
    shutter: 2,
    door_frame: 1,
    window: 1,
  };

  if (profileType && sectionExtra[profileType]) {
    total += sectionExtra[profileType];
  }

  // Apply limits
  return Math.max(STATION_LIMITS.MIN, Math.min(total, STATION_LIMITS.MAX));
}

/**
 * Get bend allowance using K-factor method (DIN 6935)
 * @param angle - bend angle in degrees
 * @param thickness - material thickness in mm
 * @param kFactor - K-factor (default 0.44 for GI)
 * @returns bend allowance in mm
 */
export function bendAllowance(angle: number, thickness: number, kFactor = 0.44): number {
  const radius = thickness * kFactor;
  return (angle * Math.PI / 180) * (radius + thickness / 2);
}

/**
 * Section-specific extra passes for complex profiles
 */
export const SECTION_EXTRA: Record<string, number> = {
  shutter: 2,
  door_frame: 1,
  window: 1,
  rack: 0,
  c_channel: 0,
  z_purlin: 0,
};

// Export all as default config object
export const SAI_CONFIG = {
  STATION_LIMITS,
  MAX_ANGLE: MAX_ANGLE_DEG,
  K_FACTORS,
  SPRINGBACK_DEG,
  YIELD_STRENGTH: YIELD_STRENGTH_MPA,
  PROFILE_TYPES,
  MATERIALS,
  ROLL_TYPES,
  STANDARDS: ROLL_FORMING_STANDARDS,
  THICKNESS_BANDS,
  thicknessBand,
  maxAnglePerPass,
  passesPerBend,
  calculateStations,
  bendAllowance,
  SECTION_EXTRA,
};

export default SAI_CONFIG;
