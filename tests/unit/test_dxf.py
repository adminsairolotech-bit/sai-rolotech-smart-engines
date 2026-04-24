"""Unit tests for hermes.dxf — written BEFORE implementation (TDD RED)."""
from __future__ import annotations

from pathlib import Path

import pytest

from hermes.dxf import DxfParseError, ProfileGeometry, parse

REAL_DXF = Path("attached_assets/Drawing1_1774780944987.dxf")


def test_parse_returns_profile_geometry() -> None:
    """parse() on real DXF must return ProfileGeometry."""
    result = parse(REAL_DXF)
    assert isinstance(result, ProfileGeometry)


def test_entity_count_is_positive() -> None:
    result = parse(REAL_DXF)
    assert result.entity_count > 0, "Real DXF must contain entities"


def test_bounding_box_is_reasonable() -> None:
    """C-profile is between 10 and 500 mm wide."""
    result = parse(REAL_DXF)
    assert 10 <= result.width_mm <= 500, f"width={result.width_mm}"
    assert 10 <= result.height_mm <= 500, f"height={result.height_mm}"


def test_bbox_min_less_than_max() -> None:
    result = parse(REAL_DXF)
    assert result.bbox_min[0] <= result.bbox_max[0]
    assert result.bbox_min[1] <= result.bbox_max[1]


def test_source_path_is_preserved() -> None:
    result = parse(REAL_DXF)
    assert result.source_path == REAL_DXF


def test_entity_count_equals_sum_of_types() -> None:
    """Sanity: entity_count should match lines+arcs+polylines at minimum."""
    result = parse(REAL_DXF)
    summed = result.lines + result.arcs + result.polylines
    assert result.entity_count >= summed


def test_parse_accepts_str_path() -> None:
    """parse() should also accept a string path."""
    result = parse(str(REAL_DXF))
    assert result.entity_count > 0


def test_parse_is_fast() -> None:
    """Runtime budget: <2 seconds on reference DXF (Rule T6)."""
    import time

    start = time.perf_counter()
    parse(REAL_DXF)
    elapsed = time.perf_counter() - start
    assert elapsed < 2.0, f"parse took {elapsed:.3f}s, budget is 2.0s"


def test_parse_is_deterministic() -> None:
    """Same input → same output."""
    r1 = parse(REAL_DXF)
    r2 = parse(REAL_DXF)
    assert r1.entity_count == r2.entity_count
    assert r1.bbox_min == r2.bbox_min
    assert r1.bbox_max == r2.bbox_max


def test_parse_missing_file_raises_file_not_found() -> None:
    with pytest.raises(FileNotFoundError):
        parse(Path("does/not/exist.dxf"))


def test_parse_empty_file_raises_dxf_parse_error(tmp_path: Path) -> None:
    empty = tmp_path / "empty.dxf"
    empty.write_text("")
    with pytest.raises(DxfParseError):
        parse(empty)
