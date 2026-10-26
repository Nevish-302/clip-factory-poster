// Post every Instagram Reel whose time has passed. Facebook is scheduled natively by fb-schedule.mjs.
// Runs on GitHub Actions: videos live in the `clips-v1` release and are downloaded one at a time.
// usage: node post-due.mjs [--dry] [--status] [--now ISO] [--max 2]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(here, "queue.json");
const tmp = path.join(here, "tmp");
const TAG = process.env.CLIPS_TAG || "clips-v1";
const arg = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : (process.argv[i + 1] ?? true); };
const dry = process.argv.includes("--dry");
const now = new Date(arg("--now", Date.now()));
const max = Number(arg("--max", 3)); // GitHub runs this only a few times a day, so each run must be able to catch up
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 3); // a clip that keeps failing is parked so it cannot block the queue (it used to: 2 bad clips used both slots of every run)
const queue = JSON.parse(fs.readFileSync(qPath, "utf8"));
const done = (e) => e.targets.every((t) => e.results[t]);
const parked = (e, t) => (e.attempts?.[t] ?? 0) >= MAX_ATTEMPTS && !process.env.RETRY_PARKED;

if (process.argv.includes("--status")) {
  console.log(`${queue.filter(done).length}/${queue.length} fully posted, ${queue.filter((e) => !done(e) && new Date(e.scheduledFor) < now).length} overdue, ${queue.filter((e) => Object.keys(e.errors).length).length} with errors`);
  for (const e of queue.filter((e) => Object.keys(e.errors).length)) console.log(" ERR", e.id, "attempts", JSON.stringify(e.attempts || {}), JSON.stringify(e.errors).slice(0, 200));
  process.exit(0);
}

// Facebook is handled by native scheduling, so by default this job only does Instagram.
const skip = new Set((process.env.SKIP_TARGETS || "facebook_reel").split(",").filter(Boolean));
const pending = (e) => e.targets.filter((t) => !e.results[t] && !skip.has(t) && !parked(e, t));
const due = queue.filter((e) => pending(e).length && new Date(e.scheduledFor) <= now).slice(0, max);
if (!due.length) { console.log("nothing due"); process.exit(0); } // idle run: no downloads, no API calls

const flag = { instagram_reel: "instagram", facebook_reel: "facebook" };
fs.mkdirSync(tmp, { recursive: true });
for (const e of due) {
  const file = path.join(tmp, e.file);
  if (!dry) execFileSync("gh", ["release", "download", TAG, "--pattern", e.file, "--dir", tmp, "--clobber"], { stdio: "inherit" });
  for (const t of pending(e)) {
    if (dry) { console.log("DRY would post", e.id, "->", t); continue; }
    try {
      const out = execFileSync("node", [path.join(here, "publish-reel.mjs"), "--video", file, "--caption", e.caption, "--targets", flag[t]], { encoding: "utf8", env: process.env });
      e.results[t] = JSON.parse(out)[t] ?? true; delete e.errors[t];
      console.log("posted", e.id, t, e.results[t]);
    } catch (err) {
      e.errors[t] = String(err.stderr || err.message).slice(0, 300); // retried on the next run until parked; other clips are unaffected
      e.attempts = { ...(e.attempts || {}), [t]: ((e.attempts || {})[t] ?? 0) + 1 };
      console.error("FAILED", e.id, t, `(attempt ${e.attempts[t]} of ${MAX_ATTEMPTS}${e.attempts[t] >= MAX_ATTEMPTS ? ", PARKED" : ""})`, e.errors[t]);
    }
  }
  fs.rmSync(file, { force: true });
  if (done(e)) { e.posted = true; e.postedAt = new Date().toISOString(); }
}
if (!dry) { fs.writeFileSync(qPath + ".tmp", JSON.stringify(queue, null, 2)); fs.renameSync(qPath + ".tmp", qPath); }
