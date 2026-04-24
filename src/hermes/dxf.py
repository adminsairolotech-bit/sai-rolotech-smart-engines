"""Real DXF parser for sheet-metal roll-forming profiles.

Replaces the legacy string-matching implementation in `dxf_processor.py`.
Uses `ezdxf` so we trust a battle-tested library instead of reinventing
the wheel (Rule B3 of HERMES_RULES_V3).

Public API:
    parse(path) -> ProfileGeometry
    ProfileGeometry  (frozen dataclass)
    DxfParseError    (raised on corrupt / invalid DXF)

All exceptions are loud (Rule C2). All numbers are typed and named with
units (Rule D1).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Union

import ezdxf
from ezdxf import DXFStructureError
from ezdxf.document import Drawing

logger = logging.getLogger(__name__)

PathLike = Union[str, Path]


class DxfParseError(Exception):
    """Raised when a file cannot be parsed as DXF."""


@dataclass(frozen=True)
class ProfileGeometry:
    """Geometric summary of a 2-D sheet-metal profile extracted from DXF."""

    source_path: Path
    entity_count: int
    lines: int
    arcs: int
    polylines: int
    bbox_min: tuple[float, float]
    bbox_max: tuple[float, float]

    @property
    def width_mm(self) -> float:
        return float(self.bbox_max[0] - self.bbox_min[0])

    @property
    def height_mm(self) -> float:
        return float(self.bbox_max[1] - self.bbox_min[1])


def _load(path: Path) -> Drawing:
    """Thin wrapper around ezdxf.readfile with precise error translation."""
    try:
        return ezdxf.readfile(str(path))
    except DXFStructureError as err:
        raise DxfParseError(f"Invalid DXF structure in {path}: {err}") from err
    except IOError as err:
        raise DxfParseError(f"Failed to read {path}: {err}") from err


def parse(path: PathLike) -> ProfileGeometry:
    """Parse a 2-D DXF into ProfileGeometry.

    Args:
        path: Path-like pointing to a DXF file.

    Returns:
        ProfileGeometry with entity counts and bounding box.

    Raises:
        FileNotFoundError: if path does not exist.
        DxfParseError: if the file exists but is not valid DXF.
    """
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"DXF not found: {p}")
    if p.stat().st_size == 0:
        raise DxfParseError(f"DXF is empty: {p}")

    doc = _load(p)
    msp = doc.modelspace()

    lines = 0
    arcs = 0
    polylines = 0
    entity_count = 0

    xs: list[float] = []
    ys: list[float] = []

    for entity in msp:
        entity_count += 1
        dxftype = entity.dxftype()

        if dxftype == "LINE":
            lines += 1
            xs.extend((entity.dxf.start.x, entity.dxf.end.x))
            ys.extend((entity.dxf.start.y, entity.dxf.end.y))
        elif dxftype == "ARC":
            arcs += 1
            c = entity.dxf.center
            r = float(entity.dxf.radius)
            xs.extend((c.x - r, c.x + r))
            ys.extend((c.y - r, c.y + r))
        elif dxftype == "LWPOLYLINE":
            polylines += 1
            for pt in entity.get_points():
                xs.append(pt[0])
                ys.append(pt[1])
        elif dxftype == "POLYLINE":
            polylines += 1
            for vertex in entity.vertices:
                loc = vertex.dxf.location
                xs.append(loc.x)
                ys.append(loc.y)
        elif dxftype == "CIRCLE":
            c = entity.dxf.center
            r = float(entity.dxf.radius)
            xs.extend((c.x - r, c.x + r))
            ys.extend((c.y - r, c.y + r))

    if not xs or not ys:
        bbox_min = (0.0, 0.0)
        bbox_max = (0.0, 0.0)
    else:
        bbox_min = (min(xs), min(ys))
        bbox_max = (max(xs), max(ys))

    geom = ProfileGeometry(
        source_path=p,
        entity_count=entity_count,
        lines=lines,
        arcs=arcs,
        polylines=polylines,
        bbox_min=bbox_min,
        bbox_max=bbox_max,
    )

    logger.info(
        "dxf_parsed",
        extra={
            "path": str(p),
            "entities": entity_count,
            "lines": lines,
            "arcs": arcs,
            "polylines": polylines,
            "width_mm": geom.width_mm,
            "height_mm": geom.height_mm,
        },
    )
    return geom
