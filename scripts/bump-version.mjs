#!/usr/bin/env node
/**
 * Pure semver bump helper for release-kit.
 *
 * Usage:
 *   node bump-version.mjs <major|minor|patch> <fromVersion>
 *   node bump-version.mjs set X.Y.Z
 *
 * Prints the new version to stdout. Does not write package.json
 * (workflows decide which files to update, if any).
 */

function parse(v) {
  const parts = String(v)
    .replace(/^v/, "")
    .split(".")
    .map((n) => Number.parseInt(n, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function bump(v, kind) {
  let [major, minor, patch] = parse(v);
  if (kind === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (kind === "minor") {
    minor += 1;
    patch = 0;
  } else if (kind === "patch") {
    patch += 1;
  } else {
    throw new Error(`Invalid level: ${kind}`);
  }
  return `${major}.${minor}.${patch}`;
}

const mode = (process.argv[2] || "patch").toLowerCase();

if (mode === "set") {
  const next = String(process.argv[3] || "").replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(next)) {
    console.error("Usage: node bump-version.mjs set X.Y.Z");
    process.exit(1);
  }
  process.stdout.write(next);
  process.exit(0);
}

if (!["major", "minor", "patch"].includes(mode)) {
  console.error(`Invalid level: ${mode}`);
  process.exit(1);
}

const from = process.argv[3];
if (!from) {
  console.error("Usage: node bump-version.mjs <major|minor|patch> <fromVersion>");
  process.exit(1);
}

process.stdout.write(bump(from, mode));
