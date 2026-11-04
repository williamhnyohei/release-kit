# Releasing

Built for **coding agents + GitHub Actions** together.

Every PR merged into `{{DEFAULT_BRANCH}}` can create the next semver tag automatically.

## Flow

1. Open a PR (agent or human). Prefer base `{{DEFAULT_BRANCH}}`.
2. Set **exactly one** `release:*` label from the **diff**:
   - `release:major` → `X.0.0`
   - `release:minor` → `x.Y.0`
   - `release:patch` → `x.y.Z`
   - `release:skip` → no tag
3. If no label is set, the **label-pr** workflow suggests one from title/body/files (heuristic, optional AI via `RELEASE_KIT_AI_KEY`). An explicit label always wins.
4. CI passes → automerge (via `AUTO_MERGE_TOKEN`).
   - Prefer independent PRs into `{{DEFAULT_BRANCH}}`. After one merges, Actions updates the others onto the new trunk and re-enables auto-merge (works with strict up-to-date).
   - Stacked PRs are OK: when the base merges, Actions retargets children and auto-merges them.
5. **Version and tag** creates `vX.Y.Z`. Optional pack workflow via `release_workflow`.

## Secrets

```bash
gh auth token | gh secret set AUTO_MERGE_TOKEN --repo {{REPO}}
# optional:
gh secret set RELEASE_KIT_AI_KEY --repo {{REPO}}
```

## AI agents

See `AGENTS.md` and `.cursor/rules/release-semver.mdc`. Agents should apply the label themselves when opening the PR.

## Doctor

```bash
npx github:williamhnyohei/release-kit#{{KIT_REF}} doctor
```
