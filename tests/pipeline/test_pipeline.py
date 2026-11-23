import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

from pipeline import run_pipeline  # noqa: E402
from pipeline.run import load_raw_input  # noqa: E402
from pipeline.validate import validate_against_sas  # noqa: E402


@pytest.fixture(scope="module")
def result():
    return run_pipeline(load_raw_input())


def test_every_output_table_matches_sas(result):
    checks = validate_against_sas(result)
    assert len(checks) == 9
    failed = [c.table for c in checks if not c.passed]
    assert not failed, f"tables differ from SAS: {failed}"


def test_steps_cover_all_three_programs(result):
    assert {s.program for s in result.steps} == {0, 1, 2}


def test_star_counts(result):
    stars = result.star["star"]
    assert stars.notna().sum() == 2891
    assert set(stars.dropna().unique()) == {1, 2, 3, 4, 5}
