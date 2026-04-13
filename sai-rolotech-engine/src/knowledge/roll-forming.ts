/**
 * ROLL FORMING KNOWLEDGE BASE
 * Complete engineering knowledge for SAI Rolotech
 */

export const SAIROLOTECH_KB = {
  category: "Roll Forming Engineering",
  source: "SAI Rolotech Smart Engines",
  entries: [
    {
      topic: "Roll Forming Process",
      content: `
ROLL FORMING FUNDAMENTALS
========================

Process Overview:
- Continuous bending of metal strip through paired rolls
- Each roll stand progressively shapes the profile
- Multiple passes through stands for complex shapes

Key Parameters:
- Strip thickness: 0.5mm - 6mm
- Strip width: Up to 2000mm
- Material: Steel, Aluminum, Stainless Steel, Galvanized
- Speed: 10-200 m/min

C-Channel Production:
1. Slitting - Cut strip to required width
2. Feeding - Continuous strip into machine
3. Pre-bending - Initial bend for accuracy
4. Rolling - Progressive forming through stands
5. Cutting - Flying cut-off or saw cutting
6. Stacking - Counting and bundling
      `,
    },
    {
      topic: "Roll Design Principles",
      content: `
ROLL DESIGN FOR C-CHANNEL & Z-PURLIN
====================================

Roll Geometry:
- Upper and lower rolls with matching contours
- Center distance determines thickness capacity
- Roll diameter: 150-350mm (typical)
- Roll material: D2 tool steel / carbide inserts

Pass Sequence for C-Channel:
1. Edge bending (both edges up)
2. Pre-forming (initial flange bend)
3. Intermediate forming
4. Final sizing

Springback Compensation:
- Material elasticity causes springback
- Overbend by 1-3 degrees depending on material
- Formula: Overbend = Springback / (1 + Springback)

Roll Gap Setting:
- Entry gap = material thickness + 0.1mm
- Exit gap = material thickness - 0.05mm
- Check with feeler gauge
      `,
    },
    {
      topic: "Common Defects & Solutions",
      content: `
ROLL FORMING DEFECTS - DIAGNOSIS & SOLUTION
==========================================

1. BOWING (Profile curves lengthwise)
   Cause: Uneven roll pressure, misaligned stands
   Solution: Check roll alignment, adjust center distances

2. TWISTING (Profile spirals)
   Cause: Asymmetric forming, uneven tension
   Solution: Verify strip enters centrally, check guides

3. EDGE WAVINESS (Wavy edges)
   Cause: Excessive edge compression, tight flanges
   Solution: Increase edge roller gap, reduce flange width

4. CENTER WAVINESS (Wavy center)
   Cause: Insufficient center support
   Solution: Add backing rolls, adjust spacing

5. CRACKING AT BENDS
   Cause: Too sharp bend radius, low ductility
   Solution: Increase bend radius, check material grade

6. DIMENSIONAL ERRORS
   Cause: Roll wear, improper setup
   Solution: Measure profile, recalibrate rolls

7. SURFACE SCRATCHES
   Cause: Debris in rolls, worn surfaces
   Solution: Clean rolls, apply anti-wear coating
      `,
    },
    {
      topic: "Machine Parameters",
      content: `
ROLL FORMING MACHINE SETTINGS
=============================

Speed Control (VFD Parameters):
- Base frequency: 50Hz
- Max frequency: 60Hz
- Acceleration time: 3-5 seconds
- Deceleration time: 5-8 seconds

Material-Specific Settings:
| Material | Thickness | Speed (m/min) | Pressure |
|----------|----------|---------------|----------|
| GI Steel | 1.5mm    | 40-60        | Medium   |
| GI Steel | 2.0mm    | 30-45        | Medium   |
| SS Steel | 1.0mm    | 25-35        | High     |
| Aluminum| 2.0mm    | 50-70        | Low      |

Oil Lubrication:
- Type: Roll forming oil (viscosity ISO VG 68)
- Flow rate: 2-4 L/hour per stand
- Pressure: 2-4 bar

Safety Checks:
- Emergency stop tested daily
- Guards in place
- No loose clothing/jewelry
- Clear work area
      `,
    },
    {
      topic: "SAI Rolotech Machine Models",
      content: `
SAI ROLOTECH MACHINE SPECIFICATIONS
===================================

R-1500 C-Channel Line:
- Strip width: 300-1250mm
- Thickness: 0.8-3.0mm
- Speed: 0-60 m/min
- Stands: 12 pairs
- Motor: 15kW x 2
- Weight: 18 tons

R-2000 Z-Purlins Line:
- Strip width: 500-1500mm
- Thickness: 1.5-4.5mm
- Speed: 0-45 m/min
- Stands: 16 pairs
- Motor: 22kW x 2
- Weight: 25 tons

R-300 Highway Guard Line:
- Strip width: 400-800mm
- Thickness: 2.5-4.0mm
- Speed: 0-30 m/min
- Stands: 20 pairs
- Motor: 37kW x 2
- Weight: 35 tons
      `,
    },
    {
      topic: "Material Specifications",
      content: `
COMMON ROLL FORMING MATERIALS
============================

Galvanized Steel (GI):
- Grade: IS 277 / ASTM A653
- Zinc coating: Z275 (275g/m²)
- Yield: 250-450 MPa
- Thickness tolerance: ±0.05mm

Cold Rolled Steel (CR):
- Grade: IS 513 / ASTM A1008
- Thickness tolerance: ±0.03mm
- Surface: Bright/Matte

Stainless Steel (SS):
- Grade: 304 / 316
- Thickness: 0.5-2.0mm
- Hardness: Annealed

Aluminum:
- Grade: 3003 / 5052
- Thickness: 0.8-3.0mm
- Temper: H14 / H32

Storage Requirements:
- Indoor storage preferred
- Stack max 5 bundles high
- VCI paper between layers
- First in, First out (FIFO)
      `,
    },
    {
      topic: "Quality Control",
      content: `
QUALITY CONTROL PROCEDURES
==========================

Incoming Material:
- Certificate of Conformity check
- Dimension verification (thickness, width)
- Visual inspection for defects

In-Process Quality:
- First piece inspection (every shift)
- Periodic sampling (every 500 pieces)
- Roll gap measurement
- Profile dimension check

Final Inspection:
- Dimensional check (height, width, flange, lip)
- Angle verification (using protractor)
- Squareness check
- Surface condition

Measurement Tools:
- Digital micrometer (0.001mm)
- Steel ruler (1m, 2m)
- Protractor (0.1° resolution)
- Vernier caliper (0.02mm)
- Profile gauge (for complex shapes)

Tolerance Standards:
- Height: ±1.0mm
- Width: ±1.5mm
- Flange width: ±0.5mm
- Angle: ±1°
      `,
    },
    {
      topic: "Troubleshooting Guide",
      content: `
MACHINE TROUBLESHOOTING
========================

PROBLEM: Machine won't start
- Check main power supply
- Check emergency stop button
- Verify safety guards closed
- Check PLC indicator lights

PROBLEM: Uneven feeding
- Check feed roll pressure
- Verify strip edge condition
- Inspect feed roll surface
- Check VFD parameters

PROBLEM: Excessive noise
- Lubricate all bearings
- Check gear mesh
- Inspect roll mounts
- Verify alignment

PROBLEM: Profile not holding shape
- Check roll wear
- Verify springback compensation
- Adjust roll gap
- Check material batch

PROBLEM: Oil leakage
- Replace worn seals
- Check oil level
- Inspect pipes for damage
- Tighten connections

PROBLEM: Electrical fault
- Check circuit breakers
- Verify overload settings
- Inspect motor windings
- Call electrician for PLC issues
      `,
    },
  ],
};
