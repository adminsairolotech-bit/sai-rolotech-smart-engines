"""
import_engine.py — File Import Engine
Accepts DXF file bytes or raw entity list. Uses ezdxf for real parsing.
"""
import logging
import tempfile
import math
from typing import Any, Dict, List, Optional, Tuple

from app.utils.response import pass_response, fail_response

logger = logging.getLogger("import_engine")


def _map_units_to_mm(units_code: int) -> Tuple[str, float]:
    units = {
        0: ("unitless", 1.0),
        1: ("inch", 25.4),
        2: ("foot", 304.8),
        3: ("mile", 1609344.0),
        4: ("mm", 1.0),
        5: ("cm", 10.0),
        6: ("m", 1000.0),
        7: ("km", 1000000.0),
        8: ("microinch", 0.0000254),
        9: ("mil", 0.0254),
        10: ("yard", 914.4),
    }
    return units.get(units_code, (f"code_{units_code}", 1.0))


def _scale_point(point: Any, scale_to_mm: float) -> List[float]:
    return [
        round(float(point[0]) * scale_to_mm, 4),
        round(float(point[1]) * scale_to_mm, 4),
    ]


def _entity_meta(entity: Any, source_type: str) -> Dict[str, Any]:
    return {
        "layer": str(getattr(entity.dxf, "layer", "0")),
        "source_entity_type": source_type,
    }


def _append_polyline_entities(entities: List[Dict[str, Any]], polyline: Any) -> None:
    points = list(polyline.points())
    if len(points) < 2:
        return
    meta = _entity_meta(polyline, "POLYLINE")

    for i in range(len(points) - 1):
        start = points[i]
        end = points[i + 1]
        entities.append({
            "type": "line",
            "start": [round(float(start[0]), 4), round(float(start[1]), 4)],
            "end": [round(float(end[0]), 4), round(float(end[1]), 4)],
            **meta,
        })

    if polyline.is_closed and len(points) > 2:
        entities.append({
            "type": "line",
            "start": [round(float(points[-1][0]), 4), round(float(points[-1][1]), 4)],
            "end": [round(float(points[0][0]), 4), round(float(points[0][1]), 4)],
            **meta,
        })


def _append_point_chain(
    entities: List[Dict[str, Any]],
    points: List[Any],
    scale_to_mm: float,
    closed: bool = False,
    meta: Optional[Dict[str, Any]] = None,
) -> None:
    if len(points) < 2:
        return
    if meta is None:
        meta = {}

    for i in range(len(points) - 1):
        start = points[i]
        end = points[i + 1]
        entities.append({
            "type": "line",
            "start": _scale_point(start, scale_to_mm),
            "end": _scale_point(end, scale_to_mm),
            **meta,
        })

    if closed:
        start = points[-1]
        end = points[0]
        entities.append({
            "type": "line",
            "start": _scale_point(start, scale_to_mm),
            "end": _scale_point(end, scale_to_mm),
            **meta,
        })


def _append_spline_entities(entities: List[Dict[str, Any]], spline: Any, scale_to_mm: float) -> None:
    meta = _entity_meta(spline, "SPLINE")
    try:
        fit_points = list(spline.fit_points)
    except Exception:
        fit_points = []

    if len(fit_points) >= 2:
        _append_point_chain(
            entities,
            fit_points,
            scale_to_mm=scale_to_mm,
            closed=bool(getattr(spline, "closed", False)),
            meta=meta,
        )
        return

    try:
        control_points = list(spline.control_points)
    except Exception:
        control_points = []

    if len(control_points) < 2:
        return

    chord_lengths = [
        math.hypot(
            float(control_points[i + 1][0]) - float(control_points[i][0]),
            float(control_points[i + 1][1]) - float(control_points[i][1]),
        )
        for i in range(len(control_points) - 1)
    ]
    avg_step = sum(chord_lengths) / len(chord_lengths) if chord_lengths else 5.0
    distance = max(0.25, min(2.0, avg_step / 4.0))

    try:
        flattened = list(spline.flattening(distance=distance))
    except Exception:
        flattened = control_points

    _append_point_chain(
        entities,
        flattened,
        scale_to_mm=scale_to_mm,
        closed=bool(getattr(spline, "closed", False)),
        meta=meta,
    )


def parse_entities(entities: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Accept pre-parsed entity list (from manual or auto mode)."""
    logger.debug("[import_engine] parse_entities called, count=%s", len(entities) if entities else 0)

    if not entities:
        logger.warning("[import_engine] No entities received")
        return fail_response("file_import_engine", "No geometry/entities received")

    return pass_response("file_import_engine", {
        "notes": ["Entities accepted"],
        "geometry": entities,
        "entity_count": len(entities),
    })


def parse_dxf_bytes(dxf_bytes: bytes) -> Dict[str, Any]:
    """Parse raw DXF bytes using ezdxf and extract LINE/ARC/POLYLINE/SPLINE entities."""
    logger.debug("[import_engine] parse_dxf_bytes called, size=%d bytes", len(dxf_bytes))
    try:
        import ezdxf
        with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
            tmp.write(dxf_bytes)
            tmp_path = tmp.name

        try:
            doc = ezdxf.readfile(tmp_path)
        finally:
            try:
                import os
                os.unlink(tmp_path)
            except OSError:
                logger.debug("[import_engine] temporary DXF file cleanup failed: %s", tmp_path)

        msp = doc.modelspace()
        entities: List[Dict[str, Any]] = []
        units_code = int(getattr(doc, "units", 0) or 0)
        units_name, units_scale_to_mm = _map_units_to_mm(units_code)
        notes = ["DXF parsed via ezdxf"]
        if units_scale_to_mm != 1.0:
            notes.append(f"Applied units conversion from {units_name} to mm (x{units_scale_to_mm}).")

        for e in msp:
            if e.dxftype() == "LINE":
                s = e.dxf.start
                en = e.dxf.end
                entities.append({
                    "type": "line",
                    "start": _scale_point((s.x, s.y), units_scale_to_mm),
                    "end": _scale_point((en.x, en.y), units_scale_to_mm),
                    **_entity_meta(e, "LINE"),
                })
            elif e.dxftype() == "ARC":
                c = e.dxf.center
                entities.append({
                    "type": "arc",
                    "center": _scale_point((c.x, c.y), units_scale_to_mm),
                    "radius": round(float(e.dxf.radius) * units_scale_to_mm, 4),
                    "start_angle": round(e.dxf.start_angle, 4),
                    "end_angle": round(e.dxf.end_angle, 4),
                    **_entity_meta(e, "ARC"),
                })
            elif e.dxftype() == "LWPOLYLINE":
                pts = list(e.get_points())
                meta = _entity_meta(e, "LWPOLYLINE")
                for i in range(len(pts) - 1):
                    entities.append({
                        "type": "line",
                        "start": _scale_point((pts[i][0], pts[i][1]), units_scale_to_mm),
                        "end": _scale_point((pts[i + 1][0], pts[i + 1][1]), units_scale_to_mm),
                        **meta,
                    })
                if e.closed and len(pts) > 1:
                    entities.append({
                        "type": "line",
                        "start": _scale_point((pts[-1][0], pts[-1][1]), units_scale_to_mm),
                        "end": _scale_point((pts[0][0], pts[0][1]), units_scale_to_mm),
                        **meta,
                    })
            elif e.dxftype() == "POLYLINE":
                points = list(e.points())
                if len(points) < 2:
                    continue
                meta = _entity_meta(e, "POLYLINE")
                _append_point_chain(
                    entities,
                    points,
                    scale_to_mm=units_scale_to_mm,
                    closed=bool(e.is_closed and len(points) > 2),
                    meta=meta,
                )
            elif e.dxftype() == "SPLINE":
                _append_spline_entities(entities, e, units_scale_to_mm)

        if not entities:
            logger.warning("[import_engine] DXF parsed but no usable entities found")
            return fail_response("file_import_engine", "DXF parsed but no LINE/ARC/LWPOLYLINE/POLYLINE/SPLINE entities found")

        logger.info("[import_engine] DXF parsed: %d entities", len(entities))
        return pass_response("file_import_engine", {
            "notes": notes,
            "geometry": entities,
            "entity_count": len(entities),
            "units_code": units_code,
            "units_name": units_name,
            "units_scale_to_mm": units_scale_to_mm,
        })
    except Exception as exc:
        logger.error("[import_engine] DXF parse error: %s", exc)
        return fail_response("file_import_engine", f"DXF parse failed: {exc}")
