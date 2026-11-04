# release-kit

**Semver by PR label → auto-merge → git tag → optional release** — without manual version bumps, and without the GitHub Actions footguns.

Born from shipping [Concord](https://github.com/williamhnyohei/concord): stacked PRs, `GITHUB_TOKEN` merges that skip `push` workflows, and “workflows awaiting approval” loops.

## Quick start

In **your** repository:

```bash
npx @williamhnyohei/release-kit init
gh auth token | gh secret set AUTO_MERGE_TOKEN
npx @williamhnyohei/release-kit doctor
```

Commit the generated `.github/workflows/*`, `docs/RELEASING.md`, and (optional) `.cursor/rules`. Protect `main` so **CI** is required.

Then every PR:

1. Add `release:major` | `release:minor` | `release:patch` | `release:skip`
2. Wait for CI — squash auto-merge runs as **you** (via `AUTO_MERGE_TOKEN`)
3. Push to `main` creates `vX.Y.Z` from the latest tag + label

## Why `AUTO_MERGE_TOKEN`?

If auto-merge is enabled with `GITHUB_TOKEN`, the merge is attributed to `github-actions[bot]`. GitHub **does not run** `push` workflows for that — so Version and tag never fires.

`AUTO_MERGE_TOKEN` must be a user PAT (or `gh auth token`) with `repo` scope.

## What you get

| Piece | Role |
|-------|------|
| `reusable-automerge.yml` | Auto-merge on default branch + stacked PR promote |
| `reusable-version-and-tag.yml` | Label → next `v*` tag (+ optional workflow dispatch) |
| `init` | Copies thin caller workflows, labels, docs, Cursor rule |
| `doctor` | Checks secret, labels, auto-merge, local files |

## Labels

| Label | Bump |
|-------|------|
| `release:major` | `X.0.0` |
| `release:minor` | `x.Y.0` |
| `release:patch` | `x.y.Z` |
| `release:skip` | no tag |

## Optional pack step

Edit `.github/workflows/version-and-tag.yml` after init:

```yaml
with:
  release_workflow: release.yml   # your pack/publish workflow
```

That workflow should accept `workflow_dispatch` input `tag`.

## CLI

```bash
npx @williamhnyohei/release-kit init --assignee you --branch main --kit-ref v0.1.0
npx @williamhnyohei/release-kit doctor
npx @williamhnyohei/release-kit init --dry-run
```

## License

MIT
