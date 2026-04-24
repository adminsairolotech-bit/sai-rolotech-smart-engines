"""Adversarial tests for hermes.dxf — hostile inputs must fail loudly (Rule T3)."""
from __future__ import annotations

from pathlib import Path

import pytest

from hermes.dxf import DxfParseError, parse


def test_empty_file_raises(tmp_path: Path) -> None:
    f = tmp_path / "empty.dxf"
    f.write_text("")
    with pytest.raises(DxfParseError):
        parse(f)


def test_garbage_bytes_raises(tmp_path: Path) -> None:
    f = tmp_path / "garbage.dxf"
    f.write_bytes(b"\x00\x01\x02this is not a dxf file at all\xff\xfe")
    with pytest.raises(DxfParseError):
        parse(f)


def test_truncated_dxf_raises(tmp_path: Path) -> None:
    """A valid DXF cut in the middle of the header must fail specifically."""
    real = Path("attached_assets/Drawing1_1774780944987.dxf").read_bytes()
    f = tmp_path / "truncated.dxf"
    f.write_bytes(real[: len(real) // 3])
    with pytest.raises(DxfParseError):
        parse(f)


def test_text_file_with_dxf_extension_raises(tmp_path: Path) -> None:
    f = tmp_path / "fake.dxf"
    f.write_text("Hello world, I am not a DXF but pretending to be.")
    with pytest.raises(DxfParseError):
        parse(f)


def test_missing_path_raises_file_not_found() -> None:
    with pytest.raises(FileNotFoundError):
        parse(Path("nonexistent/path/to.dxf"))


def test_unicode_path_works(tmp_path: Path) -> None:
    """Unicode in path must not crash the parser (Windows + Linux)."""
    folder = tmp_path / "हिंदी-пример-テスト"
    folder.mkdir()
    target = folder / "copy.dxf"
    target.write_bytes(Path("attached_assets/Drawing1_1774780944987.dxf").read_bytes())
    result = parse(target)
    assert result.entity_count > 0


def test_parse_same_file_10_times_is_stable() -> None:
    """Repeated parsing must produce identical results (no hidden state)."""
    p = Path("attached_assets/Drawing1_1774780944987.dxf")
    results = [parse(p) for _ in range(10)]
    first = results[0]
    for r in results[1:]:
        assert r.entity_count == first.entity_count
        assert r.bbox_min == first.bbox_min
        assert r.bbox_max == first.bbox_max


def test_directory_path_raises(tmp_path: Path) -> None:
    """Passing a directory (not a file) should fail loudly, not silently."""
    with pytest.raises((DxfParseError, IsADirectoryError, PermissionError, OSError)):
        parse(tmp_path)
