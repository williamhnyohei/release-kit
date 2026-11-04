import fs from "node:fs";
import path from "node:path";
import { gh, ghJson } from "./gh.js";
import { RELEASE_LABELS } from "./labels.js";

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function bad(msg) {
  console.log(`  ✗ ${msg}`);
}
function warn(msg) {
  console.log(`  ! ${msg}`);
}

export async function runDoctor(args) {
  const cwd = process.cwd();
  let repo = args.repo;
  if (!repo) {
    const info = ghJson(["repo", "view", "--json", "nameWithOwner"]);
    repo = info.nameWithOwner;
  }

  console.log(`\nrelease-kit doctor → ${repo}\n`);
  let failures = 0;

  // gh auth
  try {
    const login = gh(["api", "user", "-q", ".login"]);
    ok(`gh authenticated as ${login}`);
  } catch {
    bad("gh not authenticated (run: gh auth login)");
    failures += 1;
  }

  // secrets
  try {
    const secrets = gh(["secret", "list", "--repo", repo]);
    if (secrets.includes("AUTO_MERGE_TOKEN")) {
      ok("secret AUTO_MERGE_TOKEN is set");
    } else {
      bad("missing secret AUTO_MERGE_TOKEN — merges by github-actions[bot] skip push workflows");
      failures += 1;
    }
  } catch (err) {
    bad(`cannot list secrets: ${err.message}`);
    failures += 1;
  }

  // labels
  try {
    const labels = ghJson(["label", "list", "--repo", repo, "--json", "name"]) || [];
    const names = new Set(labels.map((l) => l.name));
    for (const label of RELEASE_LABELS) {
      if (names.has(label.name)) ok(`label ${label.name}`);
      else {
        bad(`missing label ${label.name}`);
        failures += 1;
      }
    }
  } catch (err) {
    bad(`cannot list labels: ${err.message}`);
    failures += 1;
  }

  // repo settings
  try {
    const r = ghJson([
      "api",
      `repos/${repo}`,
      "--jq",
      "{allow_auto_merge,delete_branch_on_merge,default_branch}",
    ]);
    if (r.allow_auto_merge) ok("allow_auto_merge enabled");
    else {
      bad("allow_auto_merge is false");
      failures += 1;
    }
    if (r.delete_branch_on_merge) ok("delete_branch_on_merge enabled");
    else warn("delete_branch_on_merge is false (stacked promote still works)");
  } catch (err) {
    warn(`repo settings: ${err.message}`);
  }

  // local workflow files
  const needed = ["automerge.yml", "version-and-tag.yml"];
  console.log("\nLocal workflows:");
  for (const name of needed) {
    const p = path.join(cwd, ".github", "workflows", name);
    if (fs.existsSync(p)) ok(name);
    else {
      bad(`missing .github/workflows/${name} — run init`);
      failures += 1;
    }
  }

  // docs
  if (fs.existsSync(path.join(cwd, "docs", "RELEASING.md"))) {
    ok("docs/RELEASING.md");
  } else {
    warn("docs/RELEASING.md missing");
  }

  console.log("");
  if (failures) {
    console.log(`Doctor found ${failures} problem(s).`);
    process.exitCode = 1;
  } else {
    console.log("All checks passed.");
  }
}
