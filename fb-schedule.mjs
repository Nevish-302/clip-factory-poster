// Schedule Facebook Reels natively on Meta (video_state=SCHEDULED): Meta publishes them at the right time.
// usage: node fb-schedule.mjs [--only ID] [--limit N] [--dry]
// Stops at the first failure (Meta rate-limits uploads); the next run continues where this one stopped.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(here, "queue.json");
const tmp = path.join(here, "tmp");
const TAG = process.env.CLIPS_TAG || "clips-v1";
const arg = (n) => { const i = process.argv.indexOf(n); return i < 0 ? null : process.argv[i + 1]; };
const dry = process.argv.includes("--dry");
const only = arg("--only"), limit = Number(arg("--limit") ?? 1e9);
const queue = JSON.parse(fs.readFileSync(qPath, "utf8"));
const nowS = Date.now() / 1000;
fs.mkdirSync(tmp, { recursive: true });

let n = 0;
for (const e of queue) {
  if (n >= limit || (only && e.id !== only) || e.results.facebook_reel || !e.targets.includes("facebook_reel")) continue;
  const at = Math.floor(new Date(e.scheduledFor).getTime() / 1000);
  if (at < nowS + 11 * 60) { console.log("skip (too soon or past):", e.id); continue; } // Meta needs about 10 minutes of lead time
  if (dry) { console.log("DRY would schedule", e.id, "for", e.scheduledFor); n++; continue; }
  const file = path.join(tmp, e.file);
  try {
    execFileSync("gh", ["release", "download", TAG, "--pattern", e.file, "--dir", tmp, "--clobber"], { stdio: "inherit" });
    const out = execFileSync("node", [path.join(here, "publish-reel.mjs"), "--video", file, "--caption", e.caption, "--targets", "facebook", "--schedule-at", String(at)], { encoding: "utf8", env: process.env });
    e.results.facebook_reel = JSON.parse(out).facebook_reel; e.facebookScheduled = true; delete e.errors.facebook_reel;
    console.log("scheduled on Facebook:", e.id, e.scheduledFor, e.results.facebook_reel);
  } catch (err) {
    e.errors.facebook_reel = String(err.stderr || err.message).slice(0, 300);
    console.error("FAILED", e.id, e.errors.facebook_reel);
    fs.rmSync(file, { force: true });
    fs.writeFileSync(qPath + ".tmp", JSON.stringify(queue, null, 2)); fs.renameSync(qPath + ".tmp", qPath);
    break;
  }
  fs.rmSync(file, { force: true });
  n++;
  fs.writeFileSync(qPath + ".tmp", JSON.stringify(queue, null, 2)); fs.renameSync(qPath + ".tmp", qPath); // save after every clip
}
if (!n) console.log("nothing to schedule");
