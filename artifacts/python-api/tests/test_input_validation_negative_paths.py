import io
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.engines.input_engine import validate_inputs


client = TestClient(app)


MINIMAL_DXF = b"""0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
PROFILE
10
0
20
0
11
76
21
0
0
LINE
8
PROFILE
10
76
20
0
11
76
21
14
0
ENDSEC
0
EOF
"""


def test_validate_inputs_rejects_non_positive_thickness():
    result = validate_inputs(0.0, "GI")
    assert result["status"] == "fail"
    assert "positive number" in result["reason"]


def test_validate_inputs_rejects_missing_material():
    result = validate_inputs(1.0, "")
    assert result["status"] == "fail"
    assert result["reason"] == "Material missing"


def test_auto_mode_dxf_surfaces_partial_engineering_input_failure():
    response = client.post(
        "/api/auto-mode-dxf?thickness=0&material=GI",
        files={"file": ("partial-input.dxf", io.BytesIO(MINIMAL_DXF), "application/dxf")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "fail"
    assert payload["failed_stage"] == "input_engine"
    assert "positive number" in payload["result"]["reason"]


def test_auto_mode_dxf_surfaces_missing_material_failure():
    response = client.post(
        "/api/auto-mode-dxf?thickness=1.0&material=",
        files={"file": ("missing-material.dxf", io.BytesIO(MINIMAL_DXF), "application/dxf")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "fail"
    assert payload["failed_stage"] == "input_engine"
    assert payload["result"]["reason"] == "Material missing"
