import os
import sys
import tempfile

import ezdxf

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engines.import_engine import parse_dxf_bytes


def test_parse_dxf_bytes_reads_line_arc_and_polyline_entities():
    fd, raw_path = tempfile.mkstemp(suffix=".dxf")
    os.close(fd)
    path = raw_path
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_line((0, 0), (40, 0))
    msp.add_arc(center=(40, 20), radius=20, start_angle=270, end_angle=360)
    msp.add_polyline2d([(60, 0), (80, 10), (100, 0)])
    doc.saveas(path)

    try:
        with open(path, "rb") as fh:
            result = parse_dxf_bytes(fh.read())
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    assert result["status"] == "pass"
    assert result["entity_count"] >= 4
    types = [entity["type"] for entity in result["geometry"]]
    assert "line" in types
    assert "arc" in types
    assert any(entity.get("layer") == "0" for entity in result["geometry"])
    assert any(entity.get("source_entity_type") == "ARC" for entity in result["geometry"])


def test_parse_dxf_bytes_flattens_spline_entities_into_lines():
    fd, raw_path = tempfile.mkstemp(suffix=".dxf")
    os.close(fd)
    path = raw_path
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_spline([(0, 0), (20, 10), (40, -10), (60, 0)])
    doc.saveas(path)

    try:
        with open(path, "rb") as fh:
            result = parse_dxf_bytes(fh.read())
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    assert result["status"] == "pass"
    assert result["entity_count"] >= 3
    assert all(entity["type"] == "line" for entity in result["geometry"])
    assert all(entity.get("source_entity_type") == "SPLINE" for entity in result["geometry"])


def test_parse_dxf_bytes_scales_non_mm_units_to_mm():
    fd, raw_path = tempfile.mkstemp(suffix=".dxf")
    os.close(fd)
    path = raw_path
    doc = ezdxf.new("R2010")
    doc.units = ezdxf.units.IN
    msp = doc.modelspace()
    msp.add_line((0, 0), (3.0, 0))
    msp.add_line((3.0, 0), (3.0, 0.5))
    doc.saveas(path)

    try:
        with open(path, "rb") as fh:
            result = parse_dxf_bytes(fh.read())
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    assert result["status"] == "pass"
    assert result["units_code"] == 1
    assert result["units_name"] == "inch"
    assert result["units_scale_to_mm"] == 25.4
    assert result["geometry"][0]["end"] == [76.2, 0.0]
    assert result["geometry"][1]["end"] == [76.2, 12.7]
    assert any("Applied units conversion from inch to mm" in note for note in result["notes"])
