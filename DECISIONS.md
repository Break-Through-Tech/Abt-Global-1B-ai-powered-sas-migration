# Decision Log

Add an entry when you make a decision or find a place where our Python output differs from SAS. Include the date, what was decided, why, and who decided.

## Documentation and setup (Maria)
- **Sep 29 to Oct 4, 2026:** Set up how the team works in GitHub (milestone, issues, project board, `CONTRIBUTING.md`, `.gitignore`) and chose our environment setup (`requirements.txt` with `uv`, no Docker) after testing it.

## Program 0 finalization (Fiona)
- **Nov 8, 2026:** Re-ran the full Program 0 test suite (50/50 in `tests/program_0`, 60/60 across the whole repo) and the standalone `validate.py` check against the SAS answer-key CSVs. All checkpoints pass: 0 measures excluded, mean/std max diff 3.7e-9, row count matches (4,566), all 46 standardized measures match within 1e-6. See `docs/program0/validation.md` for the full breakdown. Closed #34 (finalization issue) and #26 (superseded single-file PR) on the strength of this.
