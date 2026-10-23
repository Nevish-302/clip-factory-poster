// Re-time every not-yet-due queue entry onto a new daily slot pattern, and move the matching Facebook scheduled Reels on Meta.
// usage: node retime.mjs --start 2026-10-24 --slots 09:00,13:00,20:00 [--dry]
// Slots are IST (+05:30). Entries whose time already passed are left alone. Needs META_ACCESS_TOKEN and META_PAGE_ID (only to move Facebook times).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(here, "queue.json");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : process.argv[i + 1]; };
const dry = process.argv.includes("--dry");
const start = arg("--start"), slots = arg("--slots", "09:00,13:00,20:00").split(",");
if (!start) { console.error("--start YYYY-MM-DD is required"); process.exit(1); }
const queue = JSON.parse(fs.readFileSync(qPath, "utf8"));
const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}`;
const now = Date.now();

// every entry whose slot is still in the future, including ones whose Instagram post already went out (their Facebook Reel is still scheduled on Meta)
const todo = queue.filter((e) => new Date(e.scheduledFor).getTime() > now + 10 * 60_000);
let pageToken;
if (!dry && todo.some((e) => e.facebookScheduled)) {
  const r = await (await fetch(`${GRAPH}/${process.env.META_PAGE_ID}?fields=access_token&access_token=${process.env.META_ACCESS_TOKEN}`)).json();
  pageToken = r.access_token; if (!pageToken) { console.error("could not get a page token", JSON.stringify(r)); process.exit(1); }
}

let n = 0;
for (const e of todo) {
  const day = new Date(start + "T00:00:00+05:30"); day.setUTCDate(day.getUTCDate() + Math.floor(n / slots.length));
  const ymd = new Date(day.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const when = new Date(`${ymd}T${slots[n % slots.length]}:00+05:30`);
  n++;
  const iso = `${ymd}T${slots[(n - 1) % slots.length]}:00+05:30`;
  if (e.scheduledFor === iso) continue;
  if (dry) { console.log("DRY", e.id, e.scheduledFor.slice(0, 16), "->", iso.slice(0, 16)); continue; }
  if (e.facebookScheduled && e.results.facebook_reel) {
    const res = await (await fetch(`${GRAPH}/${e.results.facebook_reel}`, { method: "POST", body: new URLSearchParams({ scheduled_publish_time: String(Math.floor(when.getTime() / 1000)), access_token: pageToken }) })).json();
    if (!res.success) { console.error("FAILED to move Facebook time for", e.id, JSON.stringify(res)); break; } // stop: likely a rate limit; rerun later, already-moved entries are skipped
  }
  e.scheduledFor = iso;
  fs.writeFileSync(qPath + ".tmp", JSON.stringify(queue, null, 2)); fs.renameSync(qPath + ".tmp", qPath);
  console.log("moved", e.id, "->", iso.slice(0, 16));
}
console.log(`${n} entries on slots ${slots.join(", ")} from ${start}`);
