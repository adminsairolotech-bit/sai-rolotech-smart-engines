/**
 * SAI ROLO TECH - Engineering Constants
 * Shared configuration for roll forming station calculations
 * Matches Python station_engine.py and material_database.py
 */

export const STATION_LIMITS = {
  MIN: 4,
  MAX: 30,
  RECOMMENDED_MAX: 24,
};

export const MAX_ANGLE = 90; // degrees

export const K_FACTORS = {
  GI: 0.44,   // Galvanized Iron
  CR: 0.44,   // Cold Rolled
  HR: 0.42,   // Hot Rolled
  SS: 0.50,   // Stainless Steel
  AL: 0.43,   // Aluminum
  HSLA: 0.45, // High Strength Low Alloy
};

export const SPRINGBACK_DEG = {
  GI: 1.5,
  CR: 1.5,
  HR: 2.0,
  SS: 2.5,
  AL: 1.0,
  HSLA: 2.0,
};

export const YIELD_STRENGTH_MPA = {
  GI: 250,
  CR: 280,
  HR: 220,
  SS: 300,
  AL: 100,
  HSLA: 400,
};

/**
 * Thickness band classification
 * @param thickness - material thickness in mm
 * @returns band name
 */
export function thicknessBand(thickness: number): string {
  if (thickness < 0.8) return 'thin';
  if (thickness <= 1.2) return 'standard';
  if (thickness <= 2.0) return 'medium_heavy';
  return 'heavy';
}

/**
 * Get max angle per pass based on material and thickness
 * @param material - material type (GI, CR, HR, SS, AL, HSLA)
 * @param thickness - material thickness in mm
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
 * Calculate passes per bend (COPRA standard formula)
 * @param maxAngle - maximum angle per pass
 * @returns minimum number of passes (minimum 2)
 */
export function passesPerBend(maxAngle: number): number {
  return Math.max(2, Math.ceil(90 / maxAngle));
}

/**
 * Section-specific extra passes for complex profiles
 */
export const SECTION_EXTRA: Record<string, number> = {
  shutter: 2, // Shutter profiles need extra passes for rib forming
  door_frame: 1,
  window: 1,
  rack: 0,
  c_channel: 0,
  z_purlin: 0,
};
