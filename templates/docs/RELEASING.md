# Releasing

Every PR merged into `{{DEFAULT_BRANCH}}` can create the next semver tag automatically.

## Flow

1. Open a PR (prefer base `{{DEFAULT_BRANCH}}`). Stacked PRs are OK — after the base merges, children are retargeted and auto-merged.
2. Add **exactly one** label:
   - `release:major` → `X.0.0`
   - `release:minor` → `x.Y.0`
   - `release:patch` → `x.y.Z` (default if unlabeled)
   - `release:skip` → no tag
3. CI must pass. Automerge squash-merges when green.
4. **Version and tag** bumps from the latest git tag `v*` and pushes `vX.Y.Z`.
5. Optional: set `release_workflow` in `.github/workflows/version-and-tag.yml` to pack/publish.

## Required secret

```bash
gh auth token | gh secret set AUTO_MERGE_TOKEN --repo {{REPO}}
```

Merges done by `github-actions[bot]` via `GITHUB_TOKEN` **do not** trigger push workflows — so Version and tag would never run.

## Doctor

```bash
npx @williamhnyohei/release-kit doctor
```
