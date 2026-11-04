import { execFileSync } from "node:child_process";

export function gh(args, opts = {}) {
  const { input, allowFail = false } = opts;
  try {
    return execFileSync("gh", args, {
      encoding: "utf8",
      input,
      stdio: input ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    if (allowFail) {
      return (err.stdout || "").toString().trim();
    }
    const msg = (err.stderr || err.message || "").toString().trim();
    throw new Error(msg || `gh ${args.join(" ")} failed`);
  }
}

export function ghJson(args, opts = {}) {
  const raw = gh(args, opts);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function detectRepo() {
  return gh(["repo", "view", "--json", "nameWithOwner,owner,defaultBranchRef", "-q", "."]);
}
