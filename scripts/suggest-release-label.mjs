#!/usr/bin/env node
/**
 * Suggest release:major|minor|patch|skip from PR metadata + changed paths.
 *
 * Usage:
 *   node suggest-release-label.mjs --title "..." --body "..." --files files.txt
 *
 * Optional AI (OpenAI-compatible):
 *   RELEASE_KIT_AI_KEY=...
 *   RELEASE_KIT_AI_BASE_URL=https://api.openai.com/v1   (optional)
 *   RELEASE_KIT_AI_MODEL=gpt-4o-mini                     (optional)
 *
 * Prints a single label name to stdout.
 */
import fs from "node:fs";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const title = arg("title");
const body = arg("body");
const filesPath = arg("files");
const files = filesPath && fs.existsSync(filesPath)
  ? fs.readFileSync(filesPath, "utf8").split(/\r?\n/).filter(Boolean)
  : [];

const text = `${title}\n${body}`.toLowerCase();

function heuristic() {
  if (
    /\brelease:skip\b/.test(text) ||
    /\bskip(?:ping)? release\b/.test(text)
  ) {
    return "release:skip";
  }

  if (
    /breaking change|break(?:s|ing)?\b|\bmajor\b|!:/.test(text) ||
    /^[^:\n]+!:/.test(title)
  ) {
    return "release:major";
  }

  const onlyMeta =
    files.length > 0 &&
    files.every((f) =>
      /^(docs\/|\.github\/|.*\.(md|mdx)$|\.cursor\/|LICENSE|\.gitignore)/i.test(
        f,
      ),
    );
  if (onlyMeta && !/\bfeat\b|\bfeature\b|\badd\b/.test(text)) {
    return "release:skip";
  }

  if (
    /\bfeat\b|\bfeature\b|\bminor\b|^(feat)(\(.+\))?:/m.test(text) ||
    /\badd(ed|s)?\b.+\b(api|endpoint|command|ui|screen|flow)\b/.test(text)
  ) {
    return "release:minor";
  }

  if (
    /\bfix\b|\bbug\b|\bpatch\b|\bchore\b|\bci\b|\bdocs\b|^(fix|chore|docs|ci|refactor)(\(.+\))?:/m.test(
      text,
    )
  ) {
    return "release:patch";
  }

  // New source files often mean a capability.
  const srcAdds = files.filter((f) =>
    /\.(ts|tsx|js|jsx|py|go|rs)$/.test(f) && !/\.test\.|\.spec\./.test(f),
  );
  if (srcAdds.length >= 3) return "release:minor";

  return "release:patch";
}

async function withAi(fallback) {
  const key = process.env.RELEASE_KIT_AI_KEY || process.env.OPENAI_API_KEY;
  if (!key) return fallback;

  const base = (
    process.env.RELEASE_KIT_AI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.RELEASE_KIT_AI_MODEL || "gpt-4o-mini";

  const prompt = `You choose exactly one GitHub label for a semver release policy.
Labels (pick one):
- release:major — breaking / incompatible
- release:minor — new user-facing capability
- release:patch — fix, chore, docs, ci, refactor
- release:skip — no tag/release (docs-only noise, etc.)

Heuristic suggestion: ${fallback}

PR title: ${title}
PR body:
${body.slice(0, 4000)}

Changed files (${files.length}):
${files.slice(0, 200).join("\n")}

Reply with ONLY the label name.`;

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a release engineer. Answer with one label only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`AI label HTTP ${res.status}`);
      return fallback;
    }
    const data = await res.json();
    const raw = String(data.choices?.[0]?.message?.content ?? "")
      .trim()
      .toLowerCase();
    const match = raw.match(
      /release:(major|minor|patch|skip)/,
    );
    if (match) return `release:${match[1]}`;
  } catch (err) {
    console.error(`AI label failed: ${err.message || err}`);
  }
  return fallback;
}

const base = heuristic();
const label = await withAi(base);
process.stdout.write(label);
