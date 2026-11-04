import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gh, ghJson } from "./gh.js";
import { RELEASE_LABELS } from "./labels.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templates = path.join(root, "templates");

function writeFile(target, content, dryRun) {
  if (dryRun) {
    console.log(`  would write ${target}`);
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  console.log(`  wrote ${target}`);
}

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`,
  );
}

export async function runInit(args) {
  const cwd = process.cwd();
  let repo = args.repo;
  let ownerLogin = args.assignee;
  let branch = args.branch;

  if (!repo) {
    const info = ghJson([
      "repo",
      "view",
      "--json",
      "nameWithOwner,owner,defaultBranchRef",
    ]);
    repo = info.nameWithOwner;
    ownerLogin = ownerLogin || info.owner?.login;
    branch = args.branch || info.defaultBranchRef?.name || "main";
  } else if (!ownerLogin) {
    ownerLogin = repo.split("/")[0];
  }

  const kitRepo = "williamhnyohei/release-kit";
  const vars = {
    KIT_REPO: kitRepo,
    KIT_REF: args.kitRef,
    ASSIGNEE: ownerLogin,
    DEFAULT_BRANCH: branch,
    REPO: repo,
  };

  console.log(`\nrelease-kit init → ${repo} (branch ${branch})\n`);

  const workflowDir = path.join(cwd, ".github", "workflows");
  for (const name of [
    "automerge.yml",
    "version-and-tag.yml",
    "ci.yml",
    "label-pr.yml",
  ]) {
    const src = path.join(templates, "workflows", name);
    const raw = fs.readFileSync(src, "utf8");
    writeFile(path.join(workflowDir, name), render(raw, vars), args.dryRun);
  }

  writeFile(
    path.join(cwd, "docs", "RELEASING.md"),
    render(fs.readFileSync(path.join(templates, "docs", "RELEASING.md"), "utf8"), vars),
    args.dryRun,
  );

  writeFile(
    path.join(cwd, "AGENTS.md"),
    fs.readFileSync(path.join(templates, "AGENTS.md"), "utf8"),
    args.dryRun,
  );

  if (args.cursor) {
    writeFile(
      path.join(cwd, ".cursor", "rules", "release-semver.mdc"),
      fs.readFileSync(path.join(templates, "cursor", "release-semver.mdc"), "utf8"),
      args.dryRun,
    );
  }

  console.log("\nLabels:");
  for (const label of RELEASE_LABELS) {
    if (args.dryRun) {
      console.log(`  would ensure ${label.name}`);
      continue;
    }
    try {
      gh([
        "label",
        "create",
        label.name,
        "--repo",
        repo,
        "--color",
        label.color,
        "--description",
        label.description,
        "--force",
      ]);
      console.log(`  ${label.name}`);
    } catch (err) {
      console.warn(`  ! ${label.name}: ${err.message}`);
    }
  }

  console.log("\nRepo settings:");
  if (!args.dryRun) {
    try {
      gh([
        "api",
        "-X",
        "PATCH",
        `repos/${repo}`,
        "-f",
        "allow_auto_merge=true",
        "-f",
        "delete_branch_on_merge=true",
      ]);
      console.log("  allow_auto_merge=true, delete_branch_on_merge=true");
    } catch (err) {
      console.warn(`  ! could not patch repo settings: ${err.message}`);
    }
  } else {
    console.log("  would enable allow_auto_merge + delete_branch_on_merge");
  }

  console.log(`
Next (required once):

  1. Store AUTO_MERGE_TOKEN (user PAT / gh auth) — required for releases to fire:

       gh auth token | gh secret set AUTO_MERGE_TOKEN --repo ${repo}

  2. Optional AI label upgrade (OpenAI-compatible key):

       gh secret set RELEASE_KIT_AI_KEY --repo ${repo}

     Without it, label-pr still applies a heuristic label from the PR diff.
     Coding agents should follow AGENTS.md / .cursor rules and set release:* themselves.

  3. Protect ${branch}: require the CI check before merge
  4. Commit generated files; open a probe PR
  5. Run: npx github:williamhnyohei/release-kit#${args.kitRef} doctor --repo ${repo}

Built for AI + Actions together:
  - Agent judges the diff and sets release:* (preferred)
  - label-pr fills a missing label from title/body/files (+ optional LLM)
  - automerge + version-and-tag handle the rest
`);
}
