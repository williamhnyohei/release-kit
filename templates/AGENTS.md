# AGENTS.md — release-kit

This repository uses **release-kit**. It is designed to be driven by coding agents (Cursor, Copilot, etc.) together with GitHub Actions.

## Your job on every PR

1. Open the PR against the default branch (or stack intentionally).
2. Set **exactly one** label based on the **diff you implemented**:
   - `release:major` — breaking / incompatible
   - `release:minor` — new user-facing capability
   - `release:patch` — fix, chore, docs, CI, refactor
   - `release:skip` — no tag (noise / probe)
3. Do **not** ask the human to bump `package.json` manually.
4. Prefer `gh pr create ... --label "release:…"` (or `gh pr edit … --add-label`).

If Actions also runs `label-pr`, it only fills a missing `release:*` label. **A label you set wins** (unless `force: true`).

## After merge

Actions auto-merge (user PAT), create `vX.Y.Z` from the label, and optionally dispatch a release workflow. Stacked PRs are promoted automatically.
