import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const script = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "suggest-release-label.mjs",
);

function run(title, body, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rk-label-"));
  const filesPath = path.join(dir, "files.txt");
  fs.writeFileSync(filesPath, files.join("\n"));
  const r = spawnSync(
    process.execPath,
    [script, "--title", title, "--body", body, "--files", filesPath],
    { encoding: "utf8", env: { ...process.env, RELEASE_KIT_AI_KEY: "" } },
  );
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

describe("suggest-release-label", () => {
  it("detects major from breaking language", () => {
    assert.equal(
      run("break guests", "BREAKING CHANGE: protocol", ["server/index.ts"]),
      "release:major",
    );
  });

  it("detects minor from feat", () => {
    assert.equal(
      run("feat: kick dialog", "new expulsion flow", ["client/KickDialog.tsx"]),
      "release:minor",
    );
  });

  it("skips docs-only", () => {
    assert.equal(
      run("docs: readme", "typo", ["README.md", "docs/RELEASING.md"]),
      "release:skip",
    );
  });

  it("defaults patch for fixes", () => {
    assert.equal(
      run("fix: join timeout", "ack dropped", ["client/src/App.tsx"]),
      "release:patch",
    );
  });
});
