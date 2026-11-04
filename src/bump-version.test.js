import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const script = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/bump-version.mjs",
);

function run(...args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  return r;
}

describe("bump-version.mjs", () => {
  it("bumps patch/minor/major", () => {
    assert.equal(run("patch", "1.2.3").stdout, "1.2.4");
    assert.equal(run("minor", "1.2.3").stdout, "1.3.0");
    assert.equal(run("major", "1.2.3").stdout, "2.0.0");
  });

  it("accepts set", () => {
    assert.equal(run("set", "9.8.7").stdout, "9.8.7");
  });
});
