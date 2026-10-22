// Delete a clip's video from the GitHub release once it is done everywhere: Instagram posted AND Facebook scheduled
// (Meta already holds its own copy after the Facebook upload). Keeps nothing stored longer than needed.
// usage: node prune.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(here, "queue.json");
const TAG = process.env.CLIPS_TAG || "clips-v1";
const dry = process.argv.includes("--dry");
const queue = JSON.parse(fs.readFileSync(qPath, "utf8"));

let n = 0;
for (const e of queue) {
  if (e.assetDeleted || !e.targets.every((t) => e.results[t])) continue;
  if (dry) { console.log("DRY would delete", e.file); n++; continue; }
  try {
    execFileSync("gh", ["release", "delete-asset", TAG, e.file, "--yes"], { stdio: "pipe" });
    console.log("deleted", e.file);
  } catch (err) {
    const msg = String(err.stderr || err.message);
    if (!/not found|no asset/i.test(msg)) { console.error("could not delete", e.file, msg.slice(0, 200)); continue; } // keep it and retry next run
    console.log("already gone", e.file);
  }
  e.assetDeleted = true; n++;
}
if (!dry && n) { fs.writeFileSync(qPath + ".tmp", JSON.stringify(queue, null, 2)); fs.renameSync(qPath + ".tmp", qPath); }
if (!n) console.log("nothing to delete");
