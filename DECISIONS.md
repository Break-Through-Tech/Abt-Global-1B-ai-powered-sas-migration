# Decision Log

Add an entry when you make a decision or find a place where our Python output differs from SAS. Include the date, what was decided, why, and who decided.

## Documentation and setup (Maria)
- **Sep 29 to Oct 4, 2026:** Set up how the team works in GitHub (milestone, issues, project board, `CONTRIBUTING.md`, `.gitignore`) and chose our environment setup (`uv` with `pyproject.toml` and `uv.lock`, no Docker) after testing it.
- **Oct 2026:** Created the issues for each program, the prompt library and the PR review process (#16 to #21), so every task has an owner and a milestone.
- **Oct 5, 2026:** Set up `uv` with a lock file so everyone installs the same package versions.
- **Nov 8, 2026:** Created the November milestone (due Nov 30) and its issues (#36, #37), and updated the project board.
- **Nov 8, 2026:** Updated `README.md` and `CONTRIBUTING.md` (team contributions, uv setup, review rules) so they match how we actually work.
- **Nov 10, 2026:** Removed `requirements.txt`. We use `pyproject.toml` and `uv.lock` (via `uv sync`), so keeping both could cause the two lists to disagree.

## Program 0 finalization (Fiona)
- **Nov 8, 2026:** Re-ran the full Program 0 test suite (50/50 in `tests/program_0`, 60/60 across the whole repo) and the standalone `validate.py` check against the SAS answer-key CSVs. All checkpoints pass: 0 measures excluded, mean/std max diff 3.7e-9, row count matches (4,566), all 46 standardized measures match within 1e-6. See `docs/program0/validation.md` for the full breakdown. Closed #34 (finalization issue) and #26 (superseded single-file PR) on the strength of this.

## Group scores and national averages (Issue #30)

- **Nov 10, 2026 (Francis Adom, with Codex assistance).** Implemented `%grp_score` in Program 1, where SAS calls it. Program 2 computes its national averages from those generated domain scores and derives reporting eligibility from their measure counts. This keeps SAS output CSVs available for validation and lets the existing reference loader remain usable during migration. All 82 tests pass. Direct comparisons against the original `.sas7bdat` datasets cover all five domains and 4,566 hospitals, with a maximum group-score difference of 1.1e-14 and a maximum national-average difference of 1.3e-15. The existing CSV tests also pass. SAS behavior for a constant or single-observation domain still needs confirmation before applying this translation beyond the supplied July 2025 data.
