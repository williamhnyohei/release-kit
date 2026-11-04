import { runDoctor } from "./doctor.js";
import { runInit } from "./init.js";

function help() {
  console.log(`release-kit — label-driven semver + automerge + tag

Usage:
  npx @williamhnyohei/release-kit init [options]
  npx @williamhnyohei/release-kit doctor [options]

Commands:
  init     Copy workflows/docs, create labels, enable auto-merge
  doctor   Check secrets, labels, workflows, and common pitfalls

Options:
  --repo owner/name     GitHub repo (default: gh repo view)
  --assignee login      PR assignee for automerge (default: repo owner)
  --branch name         Default branch (default: main)
  --kit-ref ref         release-kit ref for reusable workflows (default: v0.1.0)
  --no-cursor           Skip .cursor/rules
  --dry-run             Print actions without writing
  -h, --help            Show help
`);
}

function parseArgs(argv) {
  const out = {
    cmd: null,
    repo: null,
    assignee: null,
    branch: "main",
    kitRef: "v0.1.0",
    cursor: true,
    dryRun: false,
  };
  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith("-")) {
    out.cmd = rest.shift();
  }
  while (rest.length) {
    const a = rest.shift();
    if (a === "-h" || a === "--help") out.cmd = "help";
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--no-cursor") out.cursor = false;
    else if (a === "--repo") out.repo = rest.shift();
    else if (a === "--assignee") out.assignee = rest.shift();
    else if (a === "--branch") out.branch = rest.shift() || "main";
    else if (a === "--kit-ref") out.kitRef = rest.shift() || "v0.1.0";
    else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

export async function main(argv) {
  const args = parseArgs(argv);
  if (!args.cmd || args.cmd === "help") {
    help();
    return;
  }
  if (args.cmd === "init") {
    await runInit(args);
    return;
  }
  if (args.cmd === "doctor") {
    await runDoctor(args);
    return;
  }
  throw new Error(`Unknown command: ${args.cmd}`);
}
