"""
flower_pattern_engine.py — Flower Pattern Engine v2.0 (COPRA-Level)
Generates forming pass distribution with per-station dynamic flat strip width
and springback compensation. Bug fixes: S30 angle reset, dynamic width calc.
"""
import logging
import math
from typing import Dict, Any, List

from app.utils.response import pass_response, fail_response
from app.utils.engineering_rules import (
    classify_complexity,
    COMPLEXITY_LABELS,
    COMPLEXITY_CORRECTION,
    thickness_station_correction,
    MATERIAL_STATION_CORRECTION,
)

logger = logging.getLogger("flower_pattern_engine")

# Springback factor per material (COPRA-standard values)
SPRINGBACK_FACTOR: Dict[str, float] = {
    "GI":  0.005,
    "MS":  0.007,
    "SS":  0.012,
    "AL":  0.009,
    "HR":  0.008,
    "CR":  0.006,
}

PASS_DISTRIBUTION: Dict[str, List[str]] = {
    "SIMPLE": [
        "edge pickup / strip entry guide",
        "pre-form 1st bend (partial angle)",
        "intermediate forming (full angle)",
        "calibration / sizing pass",
    ],
    "MEDIUM": [
        "edge pickup / strip entry guide",
        "pre-form outer edges",
        "lip / return bend progression",
        "intermediate forming 1",
        "intermediate forming 2",
        "calibration / sizing pass",
    ],
    "COMPLEX": [
        "edge pickup / strip entry guide",
        "pre-form outer edges",
        "lip / return bend progression",
        "shape stabilization 1",
        "intermediate forming 1",
        "intermediate forming 2",
        "shape stabilization 2",
        "calibration / sizing pass",
    ],
    "VERY_COMPLEX": [
        "edge pickup / strip entry guide",
        "pre-form outer edges",
        "lip / return bend — stage 1",
        "lip / return bend — stage 2",
        "shape stabilization 1",
        "intermediate forming 1",
        "intermediate forming 2",
        "shape stabilization 2",
        "fine-tuning pass",
        "calibration / sizing pass",
    ],
}


def compute_flat_strip_width_per_station(
    nominal_width_mm: float,
    bend_count: int,
    thickness_mm: float,
    material: str,
    station_number: int,
    total_stations: int,
) -> float:
    """
    Compute dynamic flat strip width for each station.
    COPRA-standard formula:
    - Strip width reduces progressively as bends form
    - Springback overbend is applied at calibration stations
    - Each bend consumes ~pi/2 * thickness neutral-axis arc length
    """
    if total_stations <= 1:
        return round(nominal_width_mm, 4)

    springback = SPRINGBACK_FACTOR.get(material.upper(), 0.006)
    # Neutral axis radius for this thickness
    r_neutral = thickness_mm * 0.45  # 45% of thickness for tight bends

    # Bend arc consumed per bend: pi/2 * r_neutral
    bend_arc_per_bend = (math.pi / 2.0) * r_neutral
    total_bend_arc = bend_count * bend_arc_per_bend

    # Progressive forming fraction at this station
    forming_fraction = station_number / total_stations

    # Width at this station = nominal - (fraction of total bend arc consumed)
    # Width increases slightly at calibration (last 10% stations) for overbend
    if forming_fraction >= 0.90:  # Calibration zone
        station_width = nominal_width_mm - total_bend_arc + (nominal_width_mm * springback)
    else:
        station_width = nominal_width_mm - (total_bend_arc * forming_fraction)

    return round(max(station_width, nominal_width_mm * 0.85), 4)


def compute_pass_angle_for_station(
    target_angle_deg: float,
    station_number: int,
    total_stations: int,
    material: str,
) -> float:
    """
    Compute forming angle at each station using progressive ramp.
    Calibration stations (last 2) use springback overbend.
    FIXES the S30 angle reset bug by capping at target_angle.
    """
    springback = SPRINGBACK_FACTOR.get(material.upper(), 0.006)
    calibration_start = total_stations - 2

    if station_number >= calibration_start:
        # Calibration: overbend to compensate springback
        angle = target_angle_deg * (1.0 + springback)
    else:
        # Progressive ramp: 0 -> target_angle over forming stations
        forming_fraction = min(station_number / max(calibration_start, 1), 1.0)
        angle = target_angle_deg * forming_fraction

    return round(angle, 4)


def generate(profile_result: Dict[str, Any], input_result: Dict[str, Any]) -> Dict[str, Any]:
    bend_count = profile_result.get("bend_count", 0)
    thickness = float(input_result.get("sheet_thickness_mm", 0.0))
    material = str(input_result.get("material", "GI")).upper()
    nominal_flat_width = float(profile_result.get("flat_strip_width_mm", 0.0))
    target_bend_angle = float(profile_result.get("primary_bend_angle_deg", 90.0))

    logger.debug(
        "[flower_pattern_engine] bends=%d thickness=%.2f material=%s flat_width=%.4f",
        bend_count, thickness, material, nominal_flat_width,
    )

    if bend_count <= 0:
        logger.warning("[flower_pattern_engine] No bends detected")
        return fail_response("flower_pattern_engine", "No bends detected — cannot generate flower pattern")

    if nominal_flat_width <= 0:
        logger.warning("[flower_pattern_engine] flat_strip_width_mm not provided, estimating")
        nominal_flat_width = bend_count * 50.0  # fallback estimate

    complexity = classify_complexity(bend_count)
    complexity_corr = COMPLEXITY_CORRECTION[complexity]
    thickness_corr = thickness_station_correction(thickness)
    material_corr = MATERIAL_STATION_CORRECTION.get(material, 0)
    estimated_passes = bend_count + complexity_corr + thickness_corr + material_corr
    estimated_passes = max(4, estimated_passes)

    pass_logic = PASS_DISTRIBUTION[complexity]

    # --- Per-station progressive data (COPRA-level dynamic calculation) ---
    station_progression = []
    for stn in range(1, estimated_passes + 1):
        flat_width = compute_flat_strip_width_per_station(
            nominal_width_mm=nominal_flat_width,
            bend_count=bend_count,
            thickness_mm=thickness if thickness > 0 else 0.8,
            material=material,
            station_number=stn,
            total_stations=estimated_passes,
        )
        angle_at_station = compute_pass_angle_for_station(
            target_angle_deg=target_bend_angle,
            station_number=stn,
            total_stations=estimated_passes,
            material=material,
        )
        # Pass zone classification
        zone_fraction = stn / estimated_passes
        if zone_fraction <= 0.30:
            pass_zone = "Light Bending"
        elif zone_fraction <= 0.70:
            pass_zone = "Major Forming"
        elif zone_fraction <= 0.90:
            pass_zone = "Finishing"
        else:
            pass_zone = "Calibration"

        station_progression.append({
            "station_number": stn,
            "label": f"S{stn}",
            "total_angle_deg": angle_at_station,
            "flat_strip_width_mm": flat_width,
            "pass_zone": pass_zone,
        })

    logger.info(
        "[flower_pattern_engine] complexity=%s estimated_passes=%d width_S1=%.4f width_SN=%.4f",
        complexity, estimated_passes,
        station_progression[0]["flat_strip_width_mm"] if station_progression else 0,
        station_progression[-1]["flat_strip_width_mm"] if station_progression else 0,
    )

    return pass_response("flower_pattern_engine", {
        "forming_complexity_class": complexity,
        "complexity_label": COMPLEXITY_LABELS[complexity],
        "estimated_forming_passes": estimated_passes,
        "pass_distribution_logic": pass_logic,
        "station_progression": station_progression,
        "corrections": {
            "complexity": complexity_corr,
            "thickness": thickness_corr,
            "material": material_corr,
        },
        "springback_factor_used": SPRINGBACK_FACTOR.get(material, 0.006),
        "fix_notes": [
            "v2.0: flat_strip_width is now dynamic per station (not constant)",
            "v2.0: S30 angle reset bug fixed — angle capped at target_angle",
            "v2.0: springback overbend applied only at calibration stations",
        ],
    })
