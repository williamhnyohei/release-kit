# release-kit

**AI-friendly release engineering for GitHub:** semver by PR label → auto-merge → git tag → optional release.

Designed to be used **with coding agents** (Cursor, Copilot, …) *and* Actions — not instead of either.

Born from shipping real apps where auto-merge, stacked PRs, and “why didn’t Version and tag run?” ate whole evenings.

## What it does

| Piece | Role |
|-------|------|
| **AGENTS.md + Cursor rule** | Instructs the AI to judge the diff and set `release:*` |
| **label-pr** | If no label yet: heuristic from title/body/files; optional LLM via `RELEASE_KIT_AI_KEY` |
| **automerge** | Squash auto-merge with **user** PAT + stacked PR promote |
| **version-and-tag** | Latest `v*` + label → new tag (+ optional release workflow) |
| **init / doctor** | Bootstrap + health check |

The agent (or you) owns the semver **decision**. Actions own merge/tag/release **execution**. `label-pr` is the safety net when a label was forgotten.

## Quick start

```bash
npx github:williamhnyohei/release-kit#v0.2.0 init
gh auth token | gh secret set AUTO_MERGE_TOKEN
# optional AI upgrade for label-pr:
# gh secret set RELEASE_KIT_AI_KEY
npx github:williamhnyohei/release-kit#v0.2.0 doctor
```

Commit the generated files. Protect `main` so **CI** is required.

## Labels

| Label | Bump |
|-------|------|
| `release:major` | `X.0.0` |
| `release:minor` | `x.Y.0` |
| `release:patch` | `x.y.Z` |
| `release:skip` | no tag |

## Why `AUTO_MERGE_TOKEN`?

`GITHUB_TOKEN` merges as `github-actions[bot]` **do not** trigger `push` workflows — Version and tag never runs. Use a user PAT (or `gh auth token`).

## Optional pack step

In `.github/workflows/version-and-tag.yml`:

```yaml
with:
  release_workflow: release.yml
```

## License

MIT
