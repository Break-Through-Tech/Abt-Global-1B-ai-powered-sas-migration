# How We Push Code: Team Guidelines

## Branching
- Don't push directly to `main`.
- Create a new branch for your task (e.g. `program-1-translation`, `docs-setup`).
- Keep branch names short and descriptive.

## Making changes
- Commit with clear messages describing what you did (e.g. "Translate Program 1 group scoring logic", not "update").
- Push your branch regularly, not just at the end.

## Testing and pull requests
- Before opening a PR, test your own work first (run your code and check it against the SAS output for your file).
- Then open a Pull Request (PR) from your branch into `main`.
- Briefly describe what the PR does and reference the related Issue (e.g. "Closes #19").
- Assign at least two other teammates to review and test the PR before merging.
- Don't merge your own PR without a review.
- In the PR, note which AI model and prompt you used (if any) and what you changed by hand. See `ai/README.md` for our AI guidelines and checklist.

## PR review checklist
Reviewers, check that:
- Row counts match the SAS output.
- Missing values are handled the way SAS handles them.
- Numeric results match the SAS output within a small tolerance for rounding.
- The code runs after a fresh `uv sync`.

## Environment and dependencies
- We use `uv`. The dependencies are listed in `pyproject.toml`, and exact versions are locked in `uv.lock`.
- After you pull, run `uv sync` to install everything.
- To add a new library, run `uv add <library>`, then commit both `pyproject.toml` and `uv.lock`.
- We're not using Docker for now.

## Issues and the Project board
- Every task has a GitHub Issue linked to the October Milestone.
- Move your Issue across the board (Backlog, Ready, In progress, In review, Done) as you work on it.

## Project-specific rules
- Don't edit or overwrite files in `data/Project_1`. The SAS outputs are our answer key for validation.
- Never commit API keys or passwords. Keep them in a `.env` file, which is ignored by Git.

## Decision log
When our Python output differs from SAS, or we choose between translation options, record what we decided and why in `DECISIONS.md`.
