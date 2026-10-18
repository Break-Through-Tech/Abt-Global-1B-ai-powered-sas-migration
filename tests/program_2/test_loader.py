import sys
from pathlib import Path

# Make data/Project_1/src importable so `program_2.loader` can be found.
# parents[2]: test file -> tests/program_2 -> tests -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "data" / "Project_1" / "src"))

import pandas as pd
import pytest
from program_2.loader import load_and_merge_domain_data, CSV_DIR, DOMAINS

# The 5 score column names created by the loader (same as the SAS rename= options)
SCORE_COLS = [name for _, name in DOMAINS]


@pytest.fixture(scope="module")
def df():
    # Run the loader once and share the result with every test below
    return load_and_merge_domain_data()


def read_source(filename):
    """Read one SAS reference CSV as a Series: index = PROVIDER_ID, value = grp_score."""
    src = pd.read_csv(CSV_DIR / filename, dtype={"PROVIDER_ID": str})
    return src.set_index("PROVIDER_ID")["grp_score"]


def test_one_row_per_provider(df):
    # No provider should appear twice after merging
    assert df["PROVIDER_ID"].is_unique


def test_row_count_is_union_of_all_ids(df):
    # SAS merge by PROVIDER_ID = full outer join:
    # total rows = every unique PROVIDER_ID found in ANY of the 5 files
    all_ids = set()
    for filename, _ in DOMAINS:
        all_ids |= set(read_source(filename).index)
    assert len(df) == len(all_ids)


@pytest.mark.parametrize("filename,col", DOMAINS)
def test_scores_match_source_csv(df, filename, col):
    # Runs once per domain file (5 times)
    src = read_source(filename)
    merged = df.set_index("PROVIDER_ID")[col]

    # Every provider in the source file has the same score in our merged table
    pd.testing.assert_series_equal(merged.reindex(src.index), src, check_names=False)

    # Count of non-missing scores is the same, so nothing extra was filled in
    assert merged.notna().sum() == src.notna().sum()