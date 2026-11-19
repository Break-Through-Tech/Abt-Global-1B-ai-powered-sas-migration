# Program 2 : Peer Testing Request
Please pull the latest changes and test **Program 2** to verify it passes all checks:

## Quick Instructions (run from the repo root)

### 1. Pull latest & sync environment
```bash
git pull
uv sync
```

### 2. Run the Program 2 test suite
```bash
uv run pytest tests/program_2 -v
```

### 3. Generate the final outputs
```bash
uv run python data/Project_1/src/program_2/kmeans.py
uv run python data/Project_1/src/program_2/national_averages.py
```

## What to Confirm
- [ ] All tests in `tests/program_2/` pass without errors.
- [ ] `data/Project_1/Python Output CSV/program_2/STAR_2025JUL.csv` is generated.
- [ ] `data/Project_1/Python Output CSV/program_2/NATIONAL_AVERAGE_2025JUL.csv` is generated.

Please let me know if you have any issues. Thanks!
