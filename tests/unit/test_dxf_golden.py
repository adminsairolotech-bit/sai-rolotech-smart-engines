"""Golden-file + coverage-boost tests using synthesized DXFs.

These tests exist to exercise LWPOLYLINE / ARC / CIRCLE / POLYLINE code paths
that the single real sample file does not contain. We generate the DXFs
programmatically with ezdxf so behaviour is deterministic and auditable.
"""
from __future__ import annotations

from pathlib import Path

import ezdxf
import pytest

from hermes.dxf import parse


@pytest.fixture
def dxf_with_all_entity_types(tmp_path: Path) -> Path:
    """Build a DXF containing LINE, ARC, CIRCLE, LWPOLYLINE, POLYLINE."""
    doc = ezdxf.new(setup=True)
    msp = doc.modelspace()
    msp.add_line((0, 0), (100, 0))
    msp.add_arc(center=(50, 50), radius=10, start_angle=0, end_angle=90)
    msp.add_circle(center=(0, 50), radius=5)
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
    msp.add_polyline2d([(20, 20), (30, 20), (30, 30), (20, 30), (20, 20)])

    out = tmp_path / "all_types.dxf"
    doc.saveas(str(out))
    return out


def test_lwpolyline_counted(dxf_with_all_entity_types: Path) -> None:
    g = parse(dxf_with_all_entity_types)
    assert g.polylines >= 2, f"expected >=2 polylines, got {g.polylines}"


def test_arc_counted(dxf_with_all_entity_types: Path) -> None:
    g = parse(dxf_with_all_entity_types)
    assert g.arcs == 1


def test_line_counted(dxf_with_all_entity_types: Path) -> None:
    g = parse(dxf_with_all_entity_types)
    assert g.lines == 1


def test_circle_expands_bounding_box(dxf_with_all_entity_types: Path) -> None:
    """Circle at (0, 50) r=5 must stretch bbox to y=55 and x=-5."""
    g = parse(dxf_with_all_entity_types)
    assert g.bbox_min[0] <= -5.0
    assert g.bbox_max[1] >= 55.0


def test_polyline_contributes_to_bbox(dxf_with_all_entity_types: Path) -> None:
    """POLYLINE2D vertices at x=20..30, y=20..30 must be inside bbox."""
    g = parse(dxf_with_all_entity_types)
    assert g.bbox_min[0] <= 0.0
    assert g.bbox_max[0] >= 30.0
    assert g.bbox_max[1] >= 30.0


def test_total_entity_count_matches(dxf_with_all_entity_types: Path) -> None:
    """1 LINE + 1 ARC + 1 CIRCLE + 1 LWPOLYLINE + 1 POLYLINE2D = 5 entities."""
    g = parse(dxf_with_all_entity_types)
    assert g.entity_count == 5


def test_empty_modelspace_produces_zero_bbox(tmp_path: Path) -> None:
    """DXF with no entities must return zero bbox, not crash."""
    doc = ezdxf.new(setup=True)
    out = tmp_path / "empty_modelspace.dxf"
    doc.saveas(str(out))

    g = parse(out)
    assert g.entity_count == 0
    assert g.bbox_min == (0.0, 0.0)
    assert g.bbox_max == (0.0, 0.0)
    assert g.width_mm == 0.0
    assert g.height_mm == 0.0
